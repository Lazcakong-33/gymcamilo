import { useEffect, useState } from 'react'
import { useWorkoutStore } from './hooks/useWorkoutStore'
import { useIsDesktop } from './hooks/useIsDesktop'
import { Navbar } from './components/Navbar'
import { BottomNav, type NavTab } from './components/BottomNav'
import { DesktopSidebar } from './components/DesktopSidebar'
import { HomeDashboard } from './components/HomeDashboard'
import { RoutinesView } from './components/RoutinesView'
import { RoutineBuilderView } from './components/RoutineBuilderView'
import { ActiveWorkoutView } from './components/ActiveWorkoutView'
import { StatsView } from './components/StatsView'
import { UserSettingsView } from './components/UserSettingsView'
import { AdminView } from './components/AdminView'
import { FloatingRestTimer } from './components/FloatingRestTimer'
import { ExerciseModal } from './components/ExerciseModal'
import { PlateCalculatorModal } from './components/PlateCalculatorModal'
import { ProfileSwitcherModal } from './components/ProfileSwitcherModal'
import { RoutineEditorModal } from './components/RoutineEditorModal'
import { LoginScreen } from './components/LoginScreen'
import type { Exercise, WorkoutDay } from './types/workout'

export function App() {
  const store = useWorkoutStore()
  const isDesktop = useIsDesktop()
  const [currentTab, setCurrentTab] = useState<NavTab>('hoy')
  const [selectedDayForRoutines, setSelectedDayForRoutines] = useState<string>('lunes-pecho-triceps')

  const [activeExerciseModal, setActiveExerciseModal] = useState<Exercise | null>(null)
  const [plateCalcOpen, setPlateCalcOpen] = useState(false)
  const [plateCalcInitialWeight, setPlateCalcInitialWeight] = useState<number>(100)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [routineEditorOpen, setRoutineEditorOpen] = useState(false)
  const [routineToEdit, setRoutineToEdit] = useState<WorkoutDay | null>(null)

  const [builderRequest, setBuilderRequest] = useState<{ routineId: string | null; token: number }>({
    routineId: null,
    token: 0
  })

  useEffect(() => {
    if (!store.isAdmin && (currentTab === 'admin' || currentTab === 'builder')) {
      setCurrentTab('hoy')
    }
  }, [store.isAdmin, currentTab])

  if (!store.isLoggedIn) {
    return (
      <LoginScreen
        profiles={store.profiles}
        onSelectProfile={store.login}
        onCreateProfile={store.createProfile}
        onDeleteProfile={store.deleteProfile}
      />
    )
  }

  const handleStartWorkout = (dayId: string) => {
    store.startWorkout(dayId)
    setCurrentTab('activo')
  }

  const handleSelectDayFromDashboard = (day: WorkoutDay) => {
    setSelectedDayForRoutines(day.id)
    setCurrentTab('rutinas')
  }

  const handleOpenPlateCalc = (weight?: number) => {
    if (weight && weight > 0) {
      setPlateCalcInitialWeight(weight)
    }
    setPlateCalcOpen(true)
  }

  const openRoutineBuilder = (routineId: string | null) => {
    setRoutineEditorOpen(false)
    setRoutineToEdit(null)
    setBuilderRequest(prev => ({ routineId, token: prev.token + 1 }))
    setCurrentTab('builder')
  }

  const handleOpenCreateRoutine = () => {
    if (isDesktop && store.isAdmin) {
      openRoutineBuilder(null)
      return
    }
    setRoutineToEdit(null)
    setRoutineEditorOpen(true)
  }

  const handleOpenEditRoutine = (routine: WorkoutDay) => {
    if (isDesktop && store.isAdmin) {
      openRoutineBuilder(routine.id)
      return
    }
    setRoutineToEdit(routine)
    setRoutineEditorOpen(true)
  }

  const handleSaveRoutine = (routine: WorkoutDay) => {
    if (routineToEdit) {
      store.updateRoutine(routine)
    } else {
      store.createRoutine(routine)
    }
  }

  const isWideTab = currentTab === 'admin' || currentTab === 'builder'

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col lg:flex-row selection:bg-amber-500 selection:text-slate-950 font-['Plus_Jakarta_Sans',sans-serif]">
      <DesktopSidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        hasActiveWorkout={!!store.activeSession}
        activeProfile={store.activeProfile}
        isAdmin={store.isAdmin}
        onOpenProfileSwitcher={() => setProfileModalOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar
          activeSessionActive={!!store.activeSession}
          onNavigateActive={() => setCurrentTab('activo')}
          activeProfile={store.activeProfile}
          onOpenProfileSwitcher={() => setProfileModalOpen(true)}
          wide={currentTab === 'admin'}
        />

        <main
          className={`flex-1 w-full mx-auto px-4 pt-4 pb-20 lg:px-8 lg:pt-6 lg:pb-10 ${
            isWideTab ? 'max-w-7xl' : 'max-w-md lg:max-w-7xl'
          }`}
        >
          {currentTab === 'hoy' && (
            <HomeDashboard
              routines={store.routines}
              assignedRoutines={store.assignedRoutines}
              history={store.history}
              prs={store.prs}
              activeSession={store.activeSession}
              activeProfile={store.activeProfile}
              onStartWorkout={handleStartWorkout}
              onNavigateActive={() => setCurrentTab('activo')}
              onSelectDay={handleSelectDayFromDashboard}
              onOpenCreateRoutine={handleOpenCreateRoutine}
            />
          )}

          {currentTab === 'rutinas' && (
            <RoutinesView
              routines={store.routines}
              assignedRoutines={store.assignedRoutines}
              selectedDayId={selectedDayForRoutines}
              onStartWorkout={handleStartWorkout}
              onOpenExerciseModal={setActiveExerciseModal}
              onOpenPlateCalculator={handleOpenPlateCalc}
              selectedAlternatives={store.selectedAlternatives}
              onToggleAlternative={store.toggleExerciseAlternative}
              onOpenCreateRoutine={handleOpenCreateRoutine}
              onOpenEditRoutine={handleOpenEditRoutine}
              onDuplicateAssignedRoutine={store.duplicateAssignedRoutine}
              onResetRoutines={store.resetRoutinesToDefault}
            />
          )}

          {currentTab === 'activo' && (
            store.activeSession ? (
              <ActiveWorkoutView
                activeSession={store.activeSession}
                routines={store.allRoutines}
                onUpdateSet={store.updateSet}
                onAddSet={store.addSetToExercise}
                onRemoveSet={store.removeSetFromExercise}
                onToggleAlternative={store.toggleExerciseAlternative}
                onUpdateNotes={store.updateExerciseNotes}
                onFinishWorkout={store.finishWorkout}
                onCancelWorkout={store.cancelWorkout}
                onOpenExerciseModal={setActiveExerciseModal}
                onOpenPlateCalculator={handleOpenPlateCalc}
              />
            ) : (
              <div className="py-12 px-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto text-2xl">
                  🏋️‍♂️
                </div>
                <h3 className="text-lg font-black text-white">No hay entrenamiento en curso</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Selecciona una de tus rutinas personalizadas para iniciar tu sesión de entrenamiento con temporizadores y registro en vivo.
                </p>
                <button
                  onClick={() => setCurrentTab('rutinas')}
                  className="py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  Ver Rutinas de Entrenamiento
                </button>
              </div>
            )
          )}

          {currentTab === 'records' && (
            <StatsView
              prs={store.prs}
              history={store.history}
              onOpenPlateCalculator={handleOpenPlateCalc}
            />
          )}

          {currentTab === 'cloud' && (
            <UserSettingsView
              activeProfile={store.activeProfile}
              onUpdateProfile={store.updateProfile}
              onOpenProfileSwitcher={() => setProfileModalOpen(true)}
              onLogout={store.logout}
              onOpenPlateCalculator={handleOpenPlateCalc}
              onExportBackup={store.exportBackupJSON}
              onImportBackup={store.importBackupJSON}
              onResetRoutines={store.resetRoutinesToDefault}
              onSyncCloud={store.syncToCloud}
            />
          )}

          {currentTab === 'admin' && store.isAdmin && (
            <AdminView
              activeProfile={store.activeProfile}
              profiles={store.profiles}
              routines={store.routines}
              libraryExercises={store.libraryExercises}
              libraryGroups={store.libraryGroups}
              libraryUpload={store.libraryUpload}
              onUploadLibrary={store.uploadExerciseLibrary}
              onRefreshLibrary={store.refreshLibraryFromCloud}
              cloudUsers={store.cloudUsers}
              onRefreshCloudUsers={store.refreshCloudUsers}
              assignments={store.assignments}
              onAssignRoutine={store.assignRoutineToProfile}
              onUnassignRoutine={store.unassignRoutine}
              assignmentStatus={store.assignmentStatus}
              onClearAssignmentStatus={store.clearAssignmentStatus}
              onCreateRoutine={handleOpenCreateRoutine}
              onEditRoutine={handleOpenEditRoutine}
              onDeleteRoutine={store.deleteRoutine}
            />
          )}

          {currentTab === 'builder' && store.isAdmin && (
            <RoutineBuilderView
              routines={store.routines}
              libraryExercises={store.libraryExercises}
              libraryGroups={store.libraryGroups}
              initialRoutineId={builderRequest.routineId}
              requestToken={builderRequest.token}
              onCreateRoutine={store.createRoutine}
              onUpdateRoutine={store.updateRoutine}
              onDeleteRoutine={store.deleteRoutine}
            />
          )}
        </main>
      </div>

      <FloatingRestTimer
        timer={store.restTimer}
        onStop={store.stopRestTimer}
        onAdjust={store.adjustRestTimer}
        onToggleMinimize={store.toggleRestTimerMinimized}
      />

      <ExerciseModal
        exercise={activeExerciseModal}
        isOpen={!!activeExerciseModal}
        onClose={() => setActiveExerciseModal(null)}
        customLinks={activeExerciseModal ? (store.customLinks[activeExerciseModal.id] || []) : []}
        onAddCustomLink={store.addCustomLink}
        onDeleteCustomLink={store.deleteCustomLink}
        isAlternativeSelected={activeExerciseModal ? !!store.selectedAlternatives[activeExerciseModal.id] : false}
        onToggleAlternative={store.toggleExerciseAlternative}
      />

      <PlateCalculatorModal
        isOpen={plateCalcOpen}
        onClose={() => setPlateCalcOpen(false)}
        initialWeight={plateCalcInitialWeight}
      />

      <ProfileSwitcherModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profiles={store.profiles}
        activeProfileId={store.activeProfileId}
        onSwitchProfile={store.switchProfile}
        onCreateProfile={store.createProfile}
        onDeleteProfile={store.deleteProfile}
      />

      <RoutineEditorModal
        isOpen={routineEditorOpen}
        onClose={() => {
          setRoutineEditorOpen(false)
          setRoutineToEdit(null)
        }}
        onSaveRoutine={handleSaveRoutine}
        onDeleteRoutine={store.deleteRoutine}
        routineToEdit={routineToEdit}
      />

      <ProgressTable />
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        hasActiveWorkout={!!store.activeSession}
        isAdmin={store.isAdmin}
      />
    </div>
  )
}

export default App

function ProgressTable() {
  const cards = [
    { label: 'Fuerza', value: '+18%', bars: [52, 68, 72, 61, 90, 100] },
    { label: 'Resistencia', value: '+12%', bars: [38, 45, 58, 76, 66, 84] },
    { label: 'Volumen', value: '+8.2%', bars: [28, 36, 52, 70, 64, 93] },
  ]

  const rows = [
    { metric: 'Sentadilla Libre (Squat)', previous: '80 kg', current: '95 kg', delta: '+15 kg' },
    { metric: 'Press de Banca (Bench)', previous: '60 kg', current: '70 kg', delta: '+10 kg' },
    { metric: 'Peso Corporal', previous: '75.5 kg', current: '74.2 kg', delta: '-1.3 kg' },
  ]

  return (
    <div
      style={{
        position: 'relative',
        margin: '20px',
        borderRadius: '22px',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(8, 12, 19, 0.96), rgba(11, 18, 28, 0.98))',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.52)',
        fontFamily: 'Inter, Segoe UI, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 22px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
          background: 'rgba(15, 23, 42, 0.8)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              display: 'inline-block',
              borderRadius: '999px',
              background: '#5fd7ff',
              boxShadow: '0 0 18px rgba(95, 215, 255, 0.9)',
            }}
          />
          <span style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#9eb7c8', textTransform: 'uppercase' }}>
            Dashboard
          </span>
        </div>
        <span style={{ color: '#9eb7c8', fontSize: '12px' }}>Últimos 30 días</span>
      </div>

      <div style={{ padding: '22px 22px 12px' }}>
        <div style={{ fontSize: '18px', color: '#edf6ff', fontWeight: 700, marginBottom: '8px' }}>
          dando resultados.
        </div>
        <h2
          style={{
            margin: '0 0 22px',
            fontSize: '28px',
            lineHeight: '1.2',
            fontWeight: 800,
            color: '#f8fbff',
          }}
        >
          Nuevo módulo: informes y comparativas de progreso
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '18px' }}>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.86)',
              border: '1px solid rgba(148, 163, 184, 0.14)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px' }}>
              {cards.map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    padding: '12px',
                    minHeight: '148px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                      color: '#a9bfd1',
                      fontSize: '12px',
                    }}
                  >
                    <span>{card.label}</span>
                    <span style={{ color: '#7ee7d0', fontWeight: 700 }}>{card.value}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '7px', height: '100px' }}>
                    {card.bars.map((height, index) => (
                      <span
                        key={`${card.label}-${index}`}
                        style={{
                          flex: 1,
                          height: `${height}%`,
                          borderRadius: '8px 8px 0 0',
                          background: index % 2 === 0 ? 'linear-gradient(180deg, #8fe8ff 0%, #2c97f3 100%)' : 'linear-gradient(180deg, #7de7d0 0%, #21a7a0 100%)',
                          boxShadow: 'inset 0 -4px 10px rgba(0,0,0,0.12)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                position: 'relative',
                margin: '12px 14px 16px',
                height: '190px',
                borderRadius: '12px',
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(11, 17, 27, 0.8))',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <svg viewBox="0 0 600 190" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <path
                  d="M0,145 L80,128 L150,118 L220,128 L300,100 L380,78 L470,92 L600,42"
                  fill="none"
                  stroke="#69d8ff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.86)',
              border: '1px solid rgba(148, 163, 184, 0.14)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                color: '#a9bfd1',
                fontSize: '12px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    display: 'inline-block',
                    borderRadius: '999px',
                    background: '#7ee7d0',
                    boxShadow: '0 0 16px rgba(126, 231, 208, 0.8)',
                  }}
                />
                Comparativa
              </span>
              <span>Mes actual</span>
            </div>

            <div
              style={{
                position: 'relative',
                height: '250px',
                margin: '12px 14px',
                borderRadius: '12px',
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(11, 17, 27, 0.8))',
                border: '1px solid rgba(148, 163, 184, 0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                }}
              />
              <svg viewBox="0 0 600 260" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <path
                  d="M0,205 L80,196 L160,186 L240,170 L320,130 L420,154 L500,96 L600,64"
                  fill="none"
                  stroke="#7ee7d0"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M0,225 L90,220 L180,212 L260,198 L330,172 L430,182 L530,144 L600,124"
                  fill="none"
                  stroke="#8ec5ff"
                  strokeWidth="2.3"
                  opacity={0.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '0 14px 16px',
              }}
            >
              {[
                { label: 'Volumen', value: '+8.2%' },
                { label: 'Consistencia', value: '84%' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    padding: '12px',
                    minHeight: '86px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#a9bfd1', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.label}</span>
                    <span style={{ color: '#8ee8cf', fontWeight: 700 }}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '28px' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: '22px', fontWeight: 800, color: '#f4f8ff' }}>
            1. ¿Qué información podrá mostrar?
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px' }}>
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85), rgba(12, 17, 28, 0.9))',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: '14px',
                padding: '16px 18px',
                minHeight: '82px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 700,
              }}
            >
              <span>📈 Evolución de fuerza</span>
              <span style={{ color: '#7ee7d0' }}>→</span>
            </div>

            <div
              style={{
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85), rgba(12, 17, 28, 0.9))',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: '14px',
                padding: '16px 18px',
                minHeight: '82px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 700,
              }}
            >
              <span>🧰 Herramienta Recortes</span>
              <span style={{ color: '#7ee7d0' }}>◉</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '14px 22px 18px',
          borderTop: '1px solid rgba(148, 163, 184, 0.12)',
          background: 'rgba(9, 13, 22, 0.82)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ background: 'rgba(30, 41, 59, 0.72)', color: '#7ee7d0' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>Ejercicio / Métrica</th>
              <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>Mes Anterior</th>
              <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>Mes Actual</th>
              <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>Progreso</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metric} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                <td style={{ padding: '11px 14px', fontSize: '14px', fontWeight: 500 }}>{row.metric}</td>
                <td style={{ padding: '11px 14px', textAlign: 'center', color: '#cbd5e1' }}>{row.previous}</td>
                <td style={{ padding: '11px 14px', textAlign: 'center', color: '#cbd5e1' }}>{row.current}</td>
                <td style={{ padding: '11px 14px', textAlign: 'center', color: '#7ee7d0', fontWeight: 700 }}>{row.delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
