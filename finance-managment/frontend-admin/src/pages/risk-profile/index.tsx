import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Stepper, Step, StepLabel,
  Radio, RadioGroup, FormControlLabel, FormControl, Alert, Chip,
  LinearProgress, Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, TextField, CircularProgress,
} from '@mui/material';
import { useQuestionnaire, useRiskProfile, useAssessRisk, useApplyToPortfolio } from '../../features/risk-profile/hooks/useRiskProfile';
import { useWallets } from '../../features/wallets/hooks/useWallets';
import type { RiskProfileLevel } from '../../shared/api/types';

const PROFILE_COLORS: Record<RiskProfileLevel, 'success' | 'info' | 'warning' | 'error'> = {
  CONSERVADOR: 'success',
  MODERADO: 'info',
  DINAMICO: 'warning',
  AGRESIVO: 'error',
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: 'Acciones',
  bond: 'Renta Fija',
  etf: 'ETFs',
  crypto: 'Criptomonedas',
};

export default function RiskProfilePage() {
  const { data: questions, isLoading: loadingQ } = useQuestionnaire();
  const { data: profile, isLoading: loadingP } = useRiskProfile();
  const assess = useAssessRisk();
  const applyToPortfolio = useApplyToPortfolio();
  const { data: wallets } = useWallets();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [applyDialog, setApplyDialog] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [tolerance, setTolerance] = useState('5');

  if (loadingQ || loadingP) return <Box p={4}><CircularProgress /></Box>;

  const totalSteps = questions?.length ?? 0;
  const currentQuestion = questions?.[step];

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    await assess.mutateAsync(answers);
    setShowQuestionnaire(false);
  };

  const handleApply = async () => {
    if (!selectedWallet || !selectedPortfolio || !profile?.targetAllocation) return;
    await applyToPortfolio.mutateAsync({
      walletId: selectedWallet,
      portfolioId: selectedPortfolio,
      allocations: profile.targetAllocation,
      tolerance: parseFloat(tolerance) || 5,
    });
    setApplyDialog(false);
  };

  const selectedWalletData = wallets?.find(w => w.id === selectedWallet);

  // Show questionnaire
  if (showQuestionnaire || !profile) {
    return (
      <Box maxWidth={700} mx="auto">
        <Typography variant="h4" mb={1}>Perfil de Riesgo</Typography>
        <Typography color="text.secondary" mb={3}>
          Responde estas {totalSteps} preguntas para determinar tu perfil inversor y obtener una asignación de activos recomendada.
        </Typography>

        {!showQuestionnaire && !profile && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" mb={2}>No tienes un perfil de riesgo todavía</Typography>
              <Typography color="text.secondary" mb={3}>
                Completa el cuestionario para obtener una asignación de activos personalizada según tu tolerancia al riesgo.
              </Typography>
              <Button variant="contained" size="large" onClick={() => setShowQuestionnaire(true)}>
                Iniciar cuestionario
              </Button>
            </CardContent>
          </Card>
        )}

        {showQuestionnaire && currentQuestion && (
          <Card>
            <CardContent>
              <Stepper activeStep={step} sx={{ mb: 3 }}>
                {questions!.map((_, i) => (
                  <Step key={i}><StepLabel /></Step>
                ))}
              </Stepper>

              <LinearProgress
                variant="determinate"
                value={((step + 1) / totalSteps) * 100}
                sx={{ mb: 3, borderRadius: 1 }}
              />

              <Typography variant="overline" color="text.secondary">
                Pregunta {step + 1} de {totalSteps}
              </Typography>
              <Typography variant="h6" mb={3} mt={0.5}>{currentQuestion.text}</Typography>

              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={answers[currentQuestion.id] ?? ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                >
                  {currentQuestion.options.map(opt => (
                    <FormControlLabel
                      key={opt.id}
                      value={opt.id}
                      control={<Radio />}
                      label={opt.label}
                      sx={{
                        mb: 1, p: 1, borderRadius: 1, border: '1px solid',
                        borderColor: answers[currentQuestion.id] === opt.id ? 'primary.main' : 'divider',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              <Box display="flex" justifyContent="space-between" mt={3}>
                <Button onClick={step === 0 ? () => setShowQuestionnaire(false) : handleBack}>
                  {step === 0 ? 'Cancelar' : 'Anterior'}
                </Button>
                {step < totalSteps - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id]}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSubmit}
                    disabled={!answers[currentQuestion.id] || assess.isPending}
                  >
                    {assess.isPending ? 'Calculando...' : 'Ver mi perfil'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }

  // Profile result
  return (
    <Box maxWidth={800} mx="auto">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Perfil de Riesgo</Typography>
        <Button variant="outlined" onClick={() => { setShowQuestionnaire(true); setStep(0); setAnswers({}); }}>
          Repetir cuestionario
        </Button>
      </Box>

      {/* Profile badge */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Chip
              label={profile.profile}
              color={PROFILE_COLORS[profile.profile]}
              size="medium"
              sx={{ fontSize: '1rem', fontWeight: 700, px: 1 }}
            />
            <Typography variant="h6" color="text.secondary">
              Score: {profile.score} / {(questions?.length ?? 5) * 5}
            </Typography>
          </Box>
          <Typography color="text.secondary">{profile.description}</Typography>
        </CardContent>
      </Card>

      {/* Target allocation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Asignación objetivo recomendada</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tipo de activo</TableCell>
                <TableCell align="right">Porcentaje</TableCell>
                <TableCell>Distribución</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(profile.targetAllocation).map(([type, pct]) => (
                <TableRow key={type}>
                  <TableCell>{ASSET_TYPE_LABELS[type] ?? type}</TableCell>
                  <TableCell align="right"><strong>{pct}%</strong></TableCell>
                  <TableCell sx={{ width: '40%' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Apply to portfolio */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Aplica esta asignación a un portfolio para activar el análisis de rebalanceo automático.
      </Alert>
      <Button variant="contained" onClick={() => setApplyDialog(true)}>
        Aplicar a un portfolio
      </Button>

      {/* Apply dialog */}
      <Dialog open={applyDialog} onClose={() => setApplyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aplicar perfil a un portfolio</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" mb={2}>
            Selecciona el portfolio al que quieres aplicar la asignación objetivo de tu perfil <strong>{profile.profile}</strong>.
          </Typography>

          <TextField
            select fullWidth label="Wallet" value={selectedWallet}
            onChange={e => { setSelectedWallet(e.target.value); setSelectedPortfolio(''); }}
            margin="normal" SelectProps={{ native: true }}
          >
            <option value="" />
            {wallets?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </TextField>

          {selectedWalletData && (
            <TextField
              select fullWidth label="Portfolio" value={selectedPortfolio}
              onChange={e => setSelectedPortfolio(e.target.value)}
              margin="normal" SelectProps={{ native: true }}
            >
              <option value="" />
              {selectedWalletData.portfolios?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </TextField>
          )}

          <TextField
            fullWidth label="Tolerancia de rebalanceo (%)" type="number"
            value={tolerance} onChange={e => setTolerance(e.target.value)}
            margin="normal" helperText="Se alertará cuando algún tipo de activo se desvíe más de este % del objetivo"
            inputProps={{ min: 1, max: 20, step: 0.5 }}
          />

          <Box display="flex" gap={2} mt={2}>
            <Button fullWidth variant="outlined" onClick={() => setApplyDialog(false)}>Cancelar</Button>
            <Button
              fullWidth variant="contained"
              onClick={handleApply}
              disabled={!selectedWallet || !selectedPortfolio || applyToPortfolio.isPending}
            >
              {applyToPortfolio.isPending ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
