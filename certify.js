// LJ Coach Certification: a three-level soccer coaching and match-analysis test. Passing a level becomes proof
// on the Sports Passport: the skills it shows count in career matches, plan steps tick themselves, match
// cards show it, and the athlete can save a certificate with a reference code. It's an LJSportMind skill
// check, not an official coaching licence, and the app says so wherever it appears.

const CERT_COOLDOWN_MIN = 10;
const CERT_REPORT_WORDS = 80;
// Career paths the check is proof for (CAREER_PATHS order): Team Video / Media Analyst, Youth or Club
// Coach, Scouting / Analytics.
const CERT_ROLES = [1, 3, 4];
const CERT_LEVELS = [
  { level: 1, pass: 8, name: "ccL1", desc: "ccL1d", skills: ["coaching"], interests: ["coaching & player development"] },
  { level: 2, pass: 9, name: "ccL2", desc: "ccL2d", skills: ["coaching"], interests: ["scouting & analytics"] },
  { level: 3, pass: 9, name: "ccL3", desc: "ccL3d", skills: ["data & analytics"], interests: ["scouting & analytics"], report: true }
];

// Each question: [question, correct answer, three wrong answers, why]. Options are shuffled when shown.
// Levels 2 and 3 use famous professional moments; only facts that published match reports agree on are
// used, and "watch" is a search for the official highlights so people see the real footage.
const CERT_QUESTIONS = {
  1: [
    {
      en: ["Which four moments of the game do coaches plan for?","In possession, out of possession, attacking transition and defensive transition","Build-up, progression, chance creation and finishing, the stages of every attack","Set pieces, open play, transitions and managing the last minutes of a game","High press, mid-block, low block and counter-press, the four defensive heights","Every phase of play fits one of these four moments, so sessions and game plans are built around them."],
      es: ["¿Qué cuatro momentos del juego planifican los entrenadores?","Con balón, sin balón, transición ofensiva y transición defensiva","Salida, progresión, creación de ocasiones y finalización, las fases de todo ataque","Balón parado, juego abierto, transiciones y gestión de los últimos minutos","Presión alta, bloque medio, bloque bajo y contrapresión, las cuatro alturas defensivas","Cada fase del juego encaja en uno de estos cuatro momentos, así que las sesiones y los planes de partido se construyen sobre ellos."]
    },
    {
      en: ["Why do teams keep width when they have the ball?","To stretch the defence and open space between defenders","To create shorter, safer passing angles so the ball circulates","To keep the full-backs deep so the team is protected on the counter","To pull the opposing midfielders back into their own box","Width pulls defenders apart, creating gaps to play through or run into."],
      es: ["¿Por qué los equipos mantienen amplitud cuando tienen el balón?","Para estirar la defensa y abrir espacios entre defensores","Para crear ángulos de pase más cortos y seguros y circular el balón","Para mantener a los laterales atrás y protegerse del contraataque","Para hundir a los centrocampistas rivales dentro de su área","La amplitud separa a los defensores y crea huecos para jugar o atacar."]
    },
    {
      en: ["What does it mean for a team to be 'compact' when defending?","Short distances between players and lines, leaving little space between them","Every player behind the ball and inside their own half at all times","Each defender tightly man-marking one attacker wherever they go","Wide players holding the touchlines so the full width is always covered","Compact teams deny the space between and behind their lines, which is where attacks hurt most."],
      es: ["¿Qué significa que un equipo esté 'compacto' al defender?","Distancias cortas entre jugadores y líneas, dejando poco espacio entre ellos","Todos los jugadores detrás del balón y en su propio campo en todo momento","Cada defensor marcando de cerca a un atacante allá donde vaya","Los jugadores de banda pegados a la línea para cubrir todo el ancho","Un equipo compacto niega el espacio entre y detrás de sus líneas, que es donde más daño hacen los ataques."]
    },
    {
      en: ["A player cannot be penalised for offside when receiving the ball directly from…","A throw-in","A pass from a midfielder","A header from a teammate","A free kick in the opponent's half","Under the Laws of the Game there is no offside offence directly from a throw-in, goal kick or corner kick."],
      es: ["Un jugador no puede ser sancionado por fuera de juego si recibe el balón directamente de…","Un saque de banda","Un pase de un centrocampista","Un cabezazo de un compañero","Un tiro libre en campo rival","Según las Reglas de Juego no hay fuera de juego directamente desde un saque de banda, de puerta o de esquina."]
    },
    {
      en: ["In a 4-2-3-1, how many central midfielders sit just in front of the back four?","Two","One","Three","Four","The '2' is a double pivot that screens the defence and helps build play."],
      es: ["En un 4-2-3-1, ¿cuántos mediocentros juegan justo delante de la línea de cuatro?","Dos","Uno","Tres","Cuatro","El '2' es un doble pivote que protege a la defensa y ayuda a iniciar el juego."]
    },
    {
      en: ["What should the first defender, the one closest to the ball, mainly do?","Delay the attacker and stop forward play while teammates recover","Win the ball straight away with a tackle before support arrives","Drop to the edge of the box and protect the goal first","Leave the ball carrier and cover the most dangerous runner","Delaying buys time for teammates to give cover and balance; diving in can let the attacker past."],
      es: ["¿Qué debe hacer sobre todo el primer defensor, el más cercano al balón?","Retrasar al atacante e impedir el juego hacia delante mientras los compañeros se recuperan","Ganar el balón de inmediato con una entrada antes de que llegue ayuda","Retroceder a la frontal del área y proteger primero la portería","Dejar al poseedor y cubrir al jugador que ataca el espacio más peligroso","Retrasar da tiempo a los compañeros para cubrir y equilibrar; tirarse puede dejar pasar al atacante."]
    },
    {
      en: ["A well-designed training session usually progresses from…","Simple, low-pressure practice to game-like practice with opponents","Hard conditioning first, then technical work once players are tired","A full match first, then isolated drills to fix the mistakes seen","Finishing work first, then passing patterns, then the warm-up","Building from simple to game-like lets players learn the idea first, then use it under real pressure."],
      es: ["Una sesión bien diseñada normalmente progresa de…","Tareas simples y con poca presión a tareas parecidas al partido, con rivales","Primero trabajo físico intenso y luego técnica cuando ya están cansados","Primero un partido completo y luego ejercicios aislados para corregir errores","Primero finalización, luego circuitos de pase y al final el calentamiento","Ir de lo simple a lo real permite aprender primero la idea y luego aplicarla bajo presión real."]
    },
    {
      en: ["Asking players 'Where was the space?' instead of telling them the answer is called…","Guided discovery (questioning)","Command style (direct instruction)","Whole–part–whole coaching","Reflective video review","Questioning makes players think for themselves, which tends to help them decide better in games."],
      es: ["Preguntar a los jugadores '¿Dónde estaba el espacio?' en lugar de darles la respuesta se llama…","Descubrimiento guiado (preguntas)","Estilo de mando directo (instrucción)","Método global–analítico–global","Revisión reflexiva en vídeo","Las preguntas hacen que los jugadores piensen por sí mismos, lo que suele ayudarles a decidir mejor en partido."]
    },
    {
      en: ["A teammate has the ball under pressure. Where should you offer support?","At an angle, out of the defender's shadow, so a pass can reach you","Directly behind the ball carrier, so they can always play backwards","Close beside the ball carrier, so they always have a short safe pass","As far away as possible, stretching the defence for a long ball","A good angle opens a clear passing line; behind the defender you're blocked."],
      es: ["Un compañero tiene el balón bajo presión. ¿Dónde debes ofrecer apoyo?","En ángulo, fuera de la sombra del defensor, para que el pase te llegue","Justo detrás del poseedor, para que siempre pueda jugar hacia atrás","Pegado al poseedor, para que siempre tenga un pase corto y seguro","Lo más lejos posible, estirando la defensa para un balón largo","Un buen ángulo abre una línea de pase limpia; detrás del defensor estás tapado."]
    },
    {
      en: ["What does 'depth' in attack mean?","Players at different distances, like a runner beyond the defence and one behind the ball","Pushing both full-backs high so the team attacks with more players","Playing longer passes in behind the defence as often as possible","Keeping your defensive line deep so there's space to counter into","Depth gives the ball carrier options at different distances and stops the defence from stepping up freely."],
      es: ["¿Qué significa 'profundidad' en ataque?","Jugadores a distintas distancias, como uno a la espalda de la defensa y otro detrás del balón","Subir a los dos laterales para atacar con más jugadores","Jugar balones largos a la espalda de la defensa siempre que se pueda","Mantener la línea defensiva atrás para tener espacio al contraataque","La profundidad da opciones al poseedor a distintas distancias e impide que la defensa adelante su línea con libertad."]
    }
  ],
  2: [
    {
      watch: "Argentina vs France 2022 World Cup final highlights",
      en: ["2022 World Cup final: Scaloni started Ángel Di María on the LEFT of a 4-3-3 instead of his usual right. What was the main tactical target?","France's right: with little help from Dembélé, Koundé was often 1v1 against Di María","Theo Hernández: pinning France's left-back so he couldn't join attacks down that flank","The left half-space, so Messi could drift inside and combine with Di María between the lines","Mbappé's flank, so Argentina could double up on him whenever France attacked down their left","Di María on the left faced France's right side. With little help from Dembélé, Koundé was exposed: Di María won the penalty for the first goal and finished the counter for the second."],
      es: ["Final del Mundial 2022: Scaloni alineó a Ángel Di María por la IZQUIERDA de un 4-3-3, no por su derecha habitual. ¿Cuál era el objetivo táctico principal?","La derecha francesa: con poca ayuda de Dembélé, Koundé quedaba a menudo 1v1 ante Di María","Theo Hernández: fijar al lateral izquierdo francés para que no se sumara al ataque por esa banda","El carril interior izquierdo, para que Messi se metiera por dentro y combinara con Di María entre líneas","La banda de Mbappé, para hacerle dos contra uno cada vez que Francia atacara por su izquierda","Di María por la izquierda se enfrentaba al lado derecho francés. Con poca ayuda de Dembélé, Koundé quedó expuesto: Di María provocó el penalti del primer gol y cerró el contraataque del segundo."]
    },
    {
      watch: "Liverpool 4-0 Barcelona 2019 Champions League highlights",
      en: ["Liverpool 4–0 Barcelona, 2019, 79th minute: Alexander-Arnold walks away from a corner, then turns and plays it quickly to an unmarked Origi, who scores. As Barcelona's set-piece analyst, which rule would most directly have prevented this?","Nearest players stay switched on and marking from the moment the ball goes out of play","Switch to zonal marking on every corner so the near-post and six-yard zones are always covered","Keep a player on the near post for every corner to block short or driven deliveries","Man-mark Liverpool's tallest players, since most corner goals come from aerial duels","The goal came while Barcelona were switched off and Origi was free. No marking scheme helps if nobody is set when the ball is played."],
      es: ["Liverpool 4–0 Barcelona, 2019, minuto 79: Alexander-Arnold se aleja de un córner, se gira y lo saca rápido para Origi, solo, que marca. Como analista de balón parado del Barcelona, ¿qué norma lo habría evitado más directamente?","Los más cercanos siguen atentos y marcando desde que el balón sale del campo","Pasar a marcaje zonal en todos los córners para cubrir siempre el primer palo y el área pequeña","Dejar a un jugador en el primer palo en cada córner para bloquear los envíos cortos o tensos","Marcar al hombre a los jugadores más altos del Liverpool, porque la mayoría de goles de córner llegan por arriba","El gol llegó con el Barcelona desconectado y Origi libre. Ningún sistema de marcaje sirve si nadie está colocado cuando se juega el balón."]
    },
    {
      watch: "Liverpool vs AC Milan 2005 Champions League final highlights",
      en: ["Istanbul 2005: Liverpool trail Milan 3–0 at half-time. Benítez brings on Dietmar Hamann and switches to three at the back. Why does this shape fit the problem?","Hamann screens the defence, which frees Gerrard to attack, while three centre-backs cover Milan's strikers","It adds an extra forward to chase three goals, accepting more risk at the back since the game looks lost","It allows man-to-man marking all over the pitch, so every Milan player always has a direct opponent","It moves Gerrard deeper beside Hamann to stop Milan's playmakers receiving between the lines","Liverpool scored three times in about six minutes after the break and won on penalties. The change gave them control in midfield and freed Gerrard to attack."],
      es: ["Estambul 2005: el Liverpool pierde 3–0 ante el Milan al descanso. Benítez mete a Dietmar Hamann y pasa a defensa de tres. ¿Por qué este dibujo encaja con el problema?","Hamann protege a la defensa y libera a Gerrard para atacar, mientras tres centrales cubren a los delanteros del Milan","Añade un delantero más para buscar tres goles, asumiendo más riesgo atrás porque el partido parece perdido","Permite marcar al hombre por todo el campo, así cada jugador del Milan siempre tiene un rival directo","Retrasa a Gerrard junto a Hamann para impedir que los creadores del Milan reciban entre líneas","El Liverpool marcó tres goles en unos seis minutos tras el descanso y ganó en los penaltis. El cambio le dio control en el medio y liberó a Gerrard para atacar."]
    },
    {
      watch: "Real Madrid 2-6 Barcelona 2009 highlights",
      en: ["Real Madrid 2–6 Barcelona, May 2009: Messi plays as a 'false nine', dropping off the centre-backs into the space in front of them. What dilemma does this create for Real Madrid's centre-backs?","Follow Messi and space opens behind; stay, and he turns freely between the lines","They must step up to squeeze Messi, which leaves the full-backs defending crosses on their own","They have to mark Messi zonally, so Barcelona's wingers get free headers at the back post","They get pulled wide to help the full-backs, leaving the box empty for Messi's late runs","A false nine attacks the gap between midfield and defence. Both choices hurt the defence, which is exactly why it works."],
      es: ["Real Madrid 2–6 Barcelona, mayo de 2009: Messi juega de 'falso nueve', bajando desde los centrales al espacio delante de ellos. ¿Qué dilema crea esto a los centrales del Real Madrid?","Si lo siguen, se abre espacio a su espalda; si se quedan, Messi se gira libre entre líneas","Tienen que adelantarse para presionar a Messi, lo que deja a los laterales defendiendo solos los centros","Deben marcar a Messi en zona, así los extremos del Barcelona rematan solos en el segundo palo","Se abren para ayudar a los laterales y dejan el área vacía para las llegadas de Messi","Un falso nueve ataca el hueco entre el medio y la defensa. Las dos opciones perjudican a la defensa, y por eso funciona."]
    },
    {
      watch: "Brazil 1-7 Germany 2014 World Cup highlights",
      en: ["Brazil 1–7 Germany, 2014: Germany score four times in about six minutes in the first half, with their midfielders repeatedly finding space between Brazil's midfield and back four. As Brazil's coach, what is the most effective immediate fix?","Get compact: a deeper, narrower block with the holding midfielders close to the back four","Push higher and press man-to-man to win the ball early, so Germany can't settle into possession","Make an attacking substitution and go for goals, since a narrow defeat is no better than a heavy one","Switch to a back five for more defenders, while the midfield keeps pressing high to win the ball back","The damage came from the gap between the lines. Closing distances limits it; chasing the game, or pressing high with a deeper defence, opens the same gap even wider."],
      es: ["Brasil 1–7 Alemania, 2014: Alemania marca cuatro goles en unos seis minutos en la primera parte, con sus centrocampistas encontrando una y otra vez espacio entre el medio y la defensa de Brasil. Como entrenador de Brasil, ¿cuál es la solución inmediata más eficaz?","Juntarse: bloque más bajo y estrecho, con los mediocentros cerca de los cuatro defensas","Adelantar líneas y presionar al hombre para recuperar pronto y que Alemania no se asiente con el balón","Hacer un cambio ofensivo e ir a por goles, porque perder por poco no es mejor que perder por mucho","Pasar a defensa de cinco para tener más defensores, mientras el medio sigue presionando arriba","El daño venía del hueco entre líneas. Cerrar distancias lo limita; ir a por el partido, o presionar arriba con la defensa atrás, abre todavía más ese hueco."]
    },
    {
      watch: "Barcelona vs Inter 2010 Champions League semi-final second leg highlights",
      en: ["Barcelona vs Inter, 2010 semi-final second leg: Thiago Motta is sent off after 28 minutes with Inter leading 3–1 on aggregate. Inter defend deep with ten men, lose 1–0 and still go through. What made this plan rational?","Two up on aggregate, they could concede once and still go through, so denying chances beat having the ball","Deep defending always concedes less xG than pressing, so it was the safest plan whatever the score","Barcelona relied on space in behind, so a deep block took away their main way of scoring","Barcelona's centre-backs were weak on the ball, so ten men could still press them high","Game state decides the plan. Inter only had to avoid conceding twice, so they gave up the ball to protect their box. Barcelona scored once, late."],
      es: ["Barcelona–Inter, vuelta de semifinales de 2010: expulsan a Thiago Motta en el minuto 28 con el Inter ganando 3–1 en el global. El Inter defiende atrás con diez, pierde 1–0 y aun así se clasifica. ¿Qué hacía racional este plan?","Con dos goles de ventaja podían encajar uno y aun así pasar, así que negar ocasiones valía más que el balón","Defender atrás siempre concede menos xG que presionar, así que era el plan más seguro con cualquier marcador","El Barcelona dependía del espacio a la espalda, así que un bloque bajo le quitaba su principal vía de gol","Los centrales del Barcelona eran flojos con balón, así que diez jugadores aún podían presionarlos arriba","El contexto del partido decide el plan. Al Inter le bastaba con no encajar dos, así que cedió el balón para proteger su área. El Barcelona marcó uno, tarde."]
    },
    {
      en: ["You press in a 4-4-2. The opponent builds up with three centre-backs and two midfielders in front of them. Which adjustment keeps pressure on the ball without leaving their two midfielders free?","A striker's curved run cuts the pass into midfield, a winger jumps the wide centre-back, the midfield steps up","Both strikers split the three centre-backs and the midfield holds its position to stay compact behind them","Drop into a 4-5-1 mid-block and only engage past halfway, accepting that they'll have a spare player","One striker man-marks the goalkeeper so the centre-backs can't recycle the ball and must play long","Against a back three, two strikers can't cover three players and the passing lanes. Using a winger to jump and curved runs to block the lanes keeps access without opening the midfield."],
      es: ["Presionas con un 4-4-2. El rival sale con tres centrales y dos centrocampistas delante. ¿Qué ajuste mantiene la presión sobre el balón sin dejar libres a sus dos centrocampistas?","Un delantero tapa con carrera curva el pase al medio, un extremo salta al central del costado y el medio adelanta","Los dos delanteros se reparten a los tres centrales y el medio mantiene su posición para estar junto detrás","Replegar en un 4-5-1 de bloque medio y solo apretar pasado el centro, aceptando que tendrán un hombre libre","Un delantero marca al hombre al portero para que los centrales no puedan recircular y tengan que jugar largo","Contra tres centrales, dos delanteros no pueden cubrir a tres jugadores y las líneas de pase. Que salte un extremo y las carreras curvas tapen líneas mantiene la presión sin abrir el medio."]
    },
    {
      en: ["In possession your team attacks in a 2-3-5 shape. What is the biggest structural risk, and the standard protection?","Counters into the wide spaces behind the five; a compact 2+3 rest defence that counter-presses at once","Too few bodies in the box for crosses; push a centre-back up as a sixth attacker to win second balls","Too few passing options in build-up; drop a forward deep so the ball reaches the front line more safely","Getting caught offside; play into feet rather than in behind, so the five can hold their positions","Five players high leaves only five behind the ball. The 2+3 must stay compact and press immediately on losing the ball, or the wide channels are open."],
      es: ["Con balón, tu equipo ataca en un 2-3-5. ¿Cuál es el mayor riesgo estructural y la protección habitual?","Contras a los espacios de banda tras los cinco; un 2+3 de reposo compacto que contrapresiona al instante","Pocos jugadores en el área para los centros; subir a un central como sexto atacante para ganar segundas jugadas","Pocas opciones de pase en la salida; bajar a un delantero para que el balón llegue más seguro arriba","Caer en fuera de juego; jugar al pie en lugar de a la espalda para que los cinco mantengan su posición","Cinco jugadores arriba dejan solo cinco detrás del balón. El 2+3 debe estar junto y presionar en cuanto se pierde, o las bandas quedan abiertas."]
    },
    {
      en: ["The opponent's left-back is excellent going forward but weak defending 1v1 in open space, and their left winger tucks inside. Which plan exploits both facts?","Pin the left-back with a high, wide winger, then switch fast after winning it to isolate them 1v1","Man-mark the left-back with your right-back so their forward runs stop and they lose their main strength","Overload your left side to keep the ball away from them, since they're the opponent's biggest threat","Press the left-back high whenever they receive, forcing errors before they can run forward","Pinning them limits their attacking runs, and quick switches catch them in open space, where they're weakest. With the winger tucked in, nobody helps them."],
      es: ["El lateral izquierdo rival es excelente en ataque pero débil defendiendo 1v1 en espacio abierto, y su extremo izquierdo se mete por dentro. ¿Qué plan aprovecha ambas cosas?","Fijar al lateral con un extremo alto y abierto, y cambiar rápido tras recuperar para dejarlo en 1v1","Marcar al hombre al lateral con tu lateral derecho para frenar sus subidas y anular su mayor virtud","Sobrecargar tu lado izquierdo para alejar el balón de él, ya que es la mayor amenaza del rival","Presionar arriba al lateral cada vez que recibe, forzando errores antes de que pueda subir","Fijarlo limita sus subidas, y los cambios rápidos lo pillan en espacio abierto, donde es más débil. Con el extremo metido por dentro, nadie le ayuda."]
    },
    {
      en: ["You lead 1–0 with 15 minutes left. The opponent brings on a second striker and switches to a back three. Which change best keeps control?","Add a centre-back to outnumber their two strikers, and leave a forward high to occupy their back three","Drop to a 4-5-1 and defend the edge of your box with everyone, clearing every ball as far as possible","Bring on another striker to score a second, since their back three leaves space for counter-attacks","Keep the same shape and tell the full-backs to tuck in, because late changes often cause confusion","Matching their two strikers with a spare defender protects the lead, while a forward left high keeps their back three busy and gives you an outlet."],
      es: ["Ganas 1–0 a falta de 15 minutos. El rival mete un segundo delantero y pasa a defensa de tres. ¿Qué cambio mantiene mejor el control?","Meter un central para superar a sus dos delanteros y dejar a un delantero arriba ocupando a sus tres centrales","Replegar en 4-5-1 y defender la frontal con todos, despejando cada balón lo más lejos posible","Meter otro delantero para marcar el segundo, ya que su defensa de tres deja espacio al contraataque","Mantener el dibujo y pedir a los laterales que cierren por dentro, porque los cambios tardíos confunden","Igualar a sus dos delanteros con un defensor de sobra protege la ventaja, y un delantero arriba mantiene ocupados a sus tres centrales y da una salida."]
    }
  ],
  3: [
    {
      en: ["A player scores on 30% of their shots over the first 10 games, far above a typical rate of about 10%. What is the best forecast for the rest of the season?","Between their current rate and the typical one, closer to typical with a small sample","About 30%, since ten games show their true finishing level and good finishers stay good","Below 10%, because a hot streak is usually followed by a cold one that evens it out","Exactly the typical rate, because early-season numbers carry no information at all","Regression to the mean: extreme results over small samples drift back toward normal. The same applies to sales reps, ad campaigns and fund managers."],
      es: ["Un jugador marca con el 30% de sus tiros en los primeros 10 partidos, muy por encima de una tasa típica de alrededor del 10%. ¿Cuál es la mejor previsión para el resto de la temporada?","Entre su tasa actual y la típica, más cerca de la típica si la muestra es pequeña","Alrededor del 30%, porque diez partidos muestran su nivel real y los buenos definidores lo mantienen","Menos del 10%, porque a una buena racha suele seguirle una mala que la compensa","Exactamente la tasa típica, porque los números de inicio de temporada no aportan nada","Regresión a la media: los resultados extremos en muestras pequeñas vuelven hacia lo normal. Pasa igual con comerciales, campañas de anuncios o gestores de fondos."]
    },
    {
      en: ["Player A has a higher pass completion than Player B in home games AND in away games, but a lower completion overall. How is that possible?","Different mixes of games: A played more hard games, where everyone completes less","It can't happen mathematically, so the home or away figures must contain a data error","A attempted fewer passes in total, so their overall percentage is unreliable and can't be compared","B's total is inflated by short backward passes that the home and away splits leave out","Simpson's paradox: combining groups with different weights can reverse a trend. Always check the mix before comparing totals, in sport, medicine or business."],
      es: ["El jugador A tiene mejor acierto en el pase que el B en casa Y fuera, pero peor en el total. ¿Cómo es posible?","Distinta mezcla de partidos: A jugó más partidos difíciles, donde todos aciertan menos","Es matemáticamente imposible, así que las cifras de casa o fuera deben tener un error","A intentó menos pases en total, así que su porcentaje global no es fiable ni comparable","El total de B está inflado por pases cortos hacia atrás que los datos de casa y fuera no incluyen","Paradoja de Simpson: juntar grupos con pesos distintos puede invertir una tendencia. Revisa siempre la composición antes de comparar totales, en deporte, medicina o negocio."]
    },
    {
      en: ["Academy players who reached the first team did more extra gym sessions as teenagers. The director wants to make extra gym compulsory. What is the biggest flaw in the evidence?","Only successes were studied; you need the habits of players who didn't make it too","The sample is too small: a single academy never produces enough first-team players to show a real effect","Gym work can't be measured reliably, because effort and intensity differ too much between sessions","The link is too weak to act on; you'd want a correlation above 0.8 before recommending anything","Survivorship bias: looking only at successes hides everyone who did the same thing and failed. It's the same flaw as studying only successful start-ups."],
      es: ["Los canteranos que llegaron al primer equipo hicieron más sesiones extra de gimnasio de adolescentes. El director quiere hacerlas obligatorias. ¿Cuál es el mayor fallo en la evidencia?","Solo se estudió a los que llegaron; faltan los hábitos de los que no llegaron","La muestra es pequeña: una sola cantera nunca produce suficientes jugadores del primer equipo para ver un efecto real","El gimnasio no se puede medir bien, porque el esfuerzo y la intensidad cambian demasiado entre sesiones","La relación es demasiado débil; haría falta una correlación superior a 0,8 antes de recomendar nada","Sesgo de supervivencia: mirar solo los éxitos oculta a todos los que hicieron lo mismo y fracasaron. Es el mismo fallo que estudiar solo las start-ups que triunfaron."]
    },
    {
      en: ["In your data, teams that cover more distance win more often. Should you tell the coach to make the players run more?","Not yet: team quality or game state could drive both; compare similar situations first","Yes: the link is strong and has held across several seasons, which is enough to act on","No: physical data never predicts results, so distance shouldn't be in the analysis at all","Yes, as long as the result is statistically significant at the 5% level","Confounding: a hidden factor can create a link between two things that don't cause each other. A significant result doesn't fix that."],
      es: ["En tus datos, los equipos que recorren más distancia ganan más a menudo. ¿Deberías decirle al entrenador que los jugadores corran más?","Todavía no: la calidad o el marcador podrían causar ambas cosas; compara situaciones parecidas","Sí: la relación es fuerte y se ha mantenido varias temporadas, lo que basta para actuar","No: los datos físicos nunca predicen resultados, así que la distancia no debería estar en el análisis","Sí, siempre que el resultado sea estadísticamente significativo al 5%","Variable de confusión: un factor oculto puede relacionar dos cosas que no se causan entre sí. Un resultado significativo no lo arregla."]
    },
    {
      en: ["The coach sets a target of a PPDA under 8 every match and rewards players for hitting it. What is the most likely side effect?","Players chase the number and press when it isn't on, so chances conceded may rise","None: PPDA is objective, so rewarding it can only make the press more consistent","Opponents adapt by going long, which makes PPDA impossible to calculate","PPDA gets worse, because players turn cautious once they're judged on it","Goodhart's law: when a measure becomes a target, it stops being a good measure. Track the outcome you actually want alongside it."],
      es: ["El entrenador fija como objetivo un PPDA por debajo de 8 en cada partido y premia a los jugadores por lograrlo. ¿Cuál es el efecto secundario más probable?","Los jugadores persiguen el número y presionan sin que toque, así que pueden subir las ocasiones en contra","Ninguno: el PPDA es objetivo, así que premiarlo solo puede hacer la presión más constante","Los rivales se adaptan jugando en largo, lo que hace imposible calcular el PPDA","El PPDA empeora, porque los jugadores se vuelven prudentes cuando se les juzga por él","Ley de Goodhart: cuando una medida se convierte en objetivo, deja de ser una buena medida. Sigue a la vez el resultado que de verdad quieres."]
    },
    {
      en: ["Team A: 15 shots, 1.1 xG. Team B: 5 shots, 1.9 xG. What is the best reading?","B created better chances; A took many low-quality, long-range shots","A was more dangerous: shot volume is the most stable predictor of goals","They were even: A's extra shots make up for B's higher xG over a match","B was lucky: xG overrates teams that take only a few shots","Volume isn't quality: about 0.07 xG per shot for A against about 0.38 for B. Counting activity instead of value is a classic error in any analyst role."],
      es: ["Equipo A: 15 tiros, 1,1 xG. Equipo B: 5 tiros, 1,9 xG. ¿Cuál es la mejor lectura?","B generó mejores ocasiones; A hizo muchos tiros lejanos y de poca calidad","A fue más peligroso: el volumen de tiros es el predictor de goles más estable","Estuvieron igualados: los tiros de más de A compensan el mayor xG de B","B tuvo suerte: el xG sobrevalora a los equipos que tiran poco","Cantidad no es calidad: unos 0,07 xG por tiro para A frente a unos 0,38 para B. Contar actividad en vez de valor es un error clásico en cualquier puesto de analista."]
    },
    {
      en: ["A new pressing plan was used for 3 games and goals conceded fell from 1.6 to 0.7 per game. How should you report it to the coach?","Promising, not proven: 3 games is tiny, so report the uncertainty and track chances conceded","Proven success: conceding fell by more than half, too big a change to be chance","Meaningless: with so few games, don't mention it to the coach until there's more data","Proven, as long as xG against also fell over the same three games","Goals are noisy over a few games. Checking xG helps, but three games still can't prove it. Report the uncertainty and what you'll watch next."],
      es: ["Un nuevo plan de presión se usó en 3 partidos y los goles encajados bajaron de 1,6 a 0,7 por partido. ¿Cómo deberías comunicárselo al entrenador?","Prometedor, no demostrado: 3 partidos es muy poco; comunica la incertidumbre y sigue las ocasiones concedidas","Éxito demostrado: los goles encajados bajaron más de la mitad, un cambio demasiado grande para ser casualidad","No significa nada: con tan pocos partidos, mejor no decírselo al entrenador hasta tener más datos","Demostrado, siempre que el xG en contra también bajara en esos tres partidos","Los goles tienen mucho ruido en pocos partidos. Mirar el xG ayuda, pero tres partidos siguen sin demostrarlo. Comunica la incertidumbre y qué vas a vigilar."]
    },
    {
      en: ["A scouting model flags 90% of future stars, but also wrongly flags 10% of ordinary players. Only 1 in 100 academy players becomes a star. If the model flags a player, roughly how likely are they to become a star?","About 8%","About 90%","About 50%","About 10%","Out of 1,000 players: 10 stars, 9 of them flagged; 990 ordinary, 99 of them flagged. So 9 of 108 flags are stars, about 8%. Ignoring the base rate is a common error in medicine, fraud detection and hiring."],
      es: ["Un modelo de scouting detecta al 90% de las futuras estrellas, pero también marca por error al 10% de los jugadores normales. Solo 1 de cada 100 canteranos llega a estrella. Si el modelo marca a un jugador, ¿qué probabilidad aproximada tiene de ser estrella?","Alrededor del 8%","Alrededor del 90%","Alrededor del 50%","Alrededor del 10%","De 1.000 jugadores: 10 estrellas, 9 marcadas; 990 normales, 99 marcados. Así que 9 de 108 marcados son estrellas, un 8%. Ignorar la tasa base es un error habitual en medicina, detección de fraude y contratación."]
    },
    {
      watch: "Barcelona vs Inter 2010 Champions League semi-final second leg highlights",
      en: ["Barcelona had most of the ball against ten-man Inter in the 2010 semi-final but only won 1–0 and went out. Which measure would best have shown the coach that their possession wasn't creating danger?","Chance quality (xG) inside the box compared with final-third entries","Pass completion in the final third, to see whether the final ball was accurate enough","Total passes and possession share, compared with their own season average","Distance covered and sprints, to see whether players made enough runs in behind","Against a deep block, passing numbers stay high whatever happens. The question is whether possession turns into good chances, so measure the output, not the activity."],
      es: ["El Barcelona tuvo casi todo el balón ante el Inter con diez en la semifinal de 2010, pero solo ganó 1–0 y quedó eliminado. ¿Qué medida habría mostrado mejor al entrenador que su posesión no generaba peligro?","La calidad de las ocasiones (xG) en el área frente a las entradas al último tercio","El acierto en el pase en el último tercio, para ver si el último pase era lo bastante preciso","El total de pases y el porcentaje de posesión, comparados con su propia media de la temporada","La distancia y los sprints, para ver si los jugadores atacaban lo suficiente la espalda","Contra un bloque bajo, los números de pase siguen altos pase lo que pase. La pregunta es si la posesión se convierte en buenas ocasiones, así que mide el resultado, no la actividad."]
    },
    {
      en: ["The head coach asks: 'Should we start the new left-back?' Your analysis says he's slightly better on average, with high uncertainty because of limited minutes. What is the best answer?","A clear yes, the reason, the uncertainty, and a check: review after three games","Send the full model output with every number so the coach can weigh the evidence and decide","Say the data can't decide yet and that it's safer to wait until he has more minutes","Say yes with full confidence, since showing doubt makes coaches ignore the analysis","Decision-makers need a recommendation they can act on, honest about the uncertainty and with a plan to check it. That holds for any analyst role."],
      es: ["El entrenador pregunta: '¿Ponemos de titular al nuevo lateral izquierdo?' Tu análisis dice que es algo mejor de media, con mucha incertidumbre por sus pocos minutos. ¿Cuál es la mejor respuesta?","Un sí claro, el motivo, la incertidumbre y una revisión: valorarlo en tres partidos","Enviar el resultado completo del modelo con todas las cifras para que el entrenador valore y decida","Decir que los datos aún no pueden decidir y que es más prudente esperar a que tenga más minutos","Decir que sí con total seguridad, porque mostrar dudas hace que los entrenadores ignoren el análisis","Quien decide necesita una recomendación aplicable, honesta con la incertidumbre y con un plan para comprobarla. Vale para cualquier puesto de analista."]
    }
  ]
};

function loadCerts(data) {
  return (data && Array.isArray(data.certs) ? data.certs : []).slice().sort((a, b) => a.level - b.level);
}

function certPassed(data, level) {
  return loadCerts(data).some((c) => c.level >= level);
}

// The next level this person can take, or null once all three are passed.
function certNextLevel(data) {
  const top = loadCerts(data).reduce((m, c) => Math.max(m, c.level), 0);
  return top < CERT_LEVELS.length ? top + 1 : null;
}

// Skills and interests the passed levels prove; effectiveProfile adds them like detected skills.
function certSkills(data) {
  const certs = loadCerts(data);
  const skills = new Set(), interests = new Set();
  certs.forEach((c) => {
    const lv = CERT_LEVELS[c.level - 1];
    if (!lv) return;
    lv.skills.forEach((s) => skills.add(s));
    lv.interests.forEach((s) => interests.add(s));
  });
  return { skills: [...skills], interests: [...interests], certs };
}

// Evidence text for a matched skill that a passed level proves (highest level first), or "".
function certEvidence(value, data) {
  const cert = loadCerts(data).reverse().find((c) => {
    const lv = CERT_LEVELS[c.level - 1];
    return lv && (lv.skills.includes(value) || lv.interests.includes(value));
  });
  return cert ? tf("evCert", { level: t(CERT_LEVELS[cert.level - 1].name), score: cert.score }) : "";
}

function certCode(data, level, score, at) {
  const src = `${(data && data.fingerprint) || ""}|${(data && data.name) || ""}|${level}|${score}|${at}`;
  const abc = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const chars = (h) => Array.from({ length: 4 }, (_, i) => abc[(h >>> (i * 5)) & 31]).join("");
  return `LJC${level}-${chars(hashString(src))}-${chars(hashString(src + "|2"))}`;
}

// "Proof" line on the match cards the check applies to, as HTML.
function certProofLine(idx, data) {
  if (!CERT_ROLES.includes(idx)) return "";
  const top = loadCerts(data).pop();
  if (top) return `<p class="cert-proof has"><a href="#certCard">${esc(tf("proofHave", { level: t(CERT_LEVELS[top.level - 1].name), code: top.code }))}</a></p>`;
  return `<p class="cert-proof"><a href="#certCard">${esc(tf("proofTake", { n: 1 }))}</a></p>`;
}

// Skills and interests one level certifies, as display labels.
function certLevelSkills(level) {
  const lv = CERT_LEVELS[level - 1];
  return lv ? [...lv.skills, ...lv.interests].map(tagLabel) : [];
}

function certWordCount(text) {
  const s = String(text || "").trim();
  if (!s) return 0;
  // Chinese and Japanese don't separate words with spaces; two characters count as roughly one word.
  if (/[぀-ヿ㐀-鿿]/.test(s)) return Math.round(s.replace(/\s/g, "").length / 2);
  return s.split(/\s+/).length;
}

if (typeof document !== "undefined") {
  const I18N_CERT = {
    en: {
      ccWatch: "Watch the official highlights ↗", ccFacts: "Real moments use only facts that published match reports agree on.",
      ccUnlock: "What your certification unlocks", ccSkillsProven: "Certified skills", ccCareers: "Career options it supports", ccLinkedIn: "Add to LinkedIn", ccCertSkills: "Certified skills: {skills}", ccIssued: "Issued {date} · Credential ID {code}", ccJobs: "Find openings:",
      ccTitle: "LJ Coach Certification",
      ccSub: "Three levels of soccer coaching and match analysis. Pass a level to add proof to your Passport: the skills count in your matches, plan steps tick, and you get a certificate to share.",
      ccNotLicence: "An LJSportMind skill check, not an official coaching licence. Pair it with your federation's licence (for example US Soccer Grassroots).",
      ccL1: "Level 1 · Foundations", ccL1d: "Principles of play, formations, sessions and the laws coaches use every day.",
      ccL2: "Level 2 · Tactical analysis", ccL2d: "Very hard. Real moments from professional matches: pressing, build-up, game state and in-game changes.",
      ccL3: "Level 3 · Match analysis", ccL3d: "Very hard. Data reasoning used in any analyst job: samples, bias, base rates, xG and PPDA, and advising decision-makers, plus a written analysis.",
      ccRule: "10 questions · pass with {pass} · retake after 10 minutes",
      ccStart: "Start Level {n}", ccLocked: "Pass Level {n} first", ccWait: "Try again in {n} min",
      ccPassed: "Passed {score}/10 · {date}", ccSubmit: "Submit answers", ccCancel: "Cancel",
      ccAnswerAll: "Answer every question first.",
      ccPassMsg: "Passed: {score}/10. {level} is now proof on your Passport.",
      ccFailMsg: "{score}/10. You need {pass} to pass. Review these topics and try again in {min} minutes:",
      ccMissed: "What you missed",
      ccReport: "Your written analysis",
      ccReportHint: "Pick a match you watched. Describe one problem you saw, the evidence (moments, numbers), and the training session you'd run to fix it. At least {n} words.",
      ccWords: "{n} words", ccNeedWords: "Write at least {n} words for your analysis.",
      ccDownload: "Save certificate", ccCode: "Reference code: {code}",
      ccEnglishOnly: "Questions are in English for now.",
      ccCertHead: "Certification", ccAwardedTo: "Awarded to", ccAthlete: "LJSportMind athlete",
      ccCertFoot: "LJSportMind skill check · not an official coaching licence",
      evCert: "LJ Coach {level} passed ({score}/10)",
      proofHave: "Proof: LJ Coach {level} ✓ · {code}",
      proofTake: "Prove it: take LJ Coach Level {n} →",
      planCert: "Pass LJ Coach {name}."
    },
    es: {
      ccWatch: "Ver el resumen oficial ↗", ccFacts: "Los momentos reales usan solo hechos en los que coinciden las crónicas publicadas.",
      ccUnlock: "Lo que desbloquea tu certificación", ccSkillsProven: "Habilidades certificadas", ccCareers: "Opciones de carrera que respalda", ccLinkedIn: "Añadir a LinkedIn", ccCertSkills: "Habilidades certificadas: {skills}", ccIssued: "Emitida el {date} · ID de credencial {code}", ccJobs: "Buscar ofertas:",
      ccTitle: "Certificación LJ Coach",
      ccSub: "Tres niveles de entrenamiento y análisis de fútbol. Aprueba un nivel para añadir una prueba a tu Pasaporte: las habilidades cuentan en tus carreras compatibles, los pasos del plan se marcan y obtienes un certificado para compartir.",
      ccNotLicence: "Una prueba de habilidades de LJSportMind, no una licencia oficial de entrenador. Complétala con la licencia de tu federación (por ejemplo US Soccer Grassroots).",
      ccL1: "Nivel 1 · Fundamentos", ccL1d: "Principios de juego, sistemas, sesiones y las reglas que los entrenadores usan cada día.",
      ccL2: "Nivel 2 · Análisis táctico", ccL2d: "Muy difícil. Momentos reales de partidos profesionales: presión, salida de balón, contexto del partido y cambios durante el juego.",
      ccL3: "Nivel 3 · Análisis de partido", ccL3d: "Muy difícil. Razonamiento con datos que se usa en cualquier puesto de analista: muestras, sesgos, tasas base, xG y PPDA, y asesorar a quien decide, más un análisis escrito.",
      ccRule: "10 preguntas · se aprueba con {pass} · repetir tras 10 minutos",
      ccStart: "Empezar el nivel {n}", ccLocked: "Aprueba primero el nivel {n}", ccWait: "Inténtalo de nuevo en {n} min",
      ccPassed: "Aprobado {score}/10 · {date}", ccSubmit: "Enviar respuestas", ccCancel: "Cancelar",
      ccAnswerAll: "Responde primero todas las preguntas.",
      ccPassMsg: "Aprobado: {score}/10. {level} ya es una prueba en tu Pasaporte.",
      ccFailMsg: "{score}/10. Necesitas {pass} para aprobar. Repasa estos temas e inténtalo de nuevo en {min} minutos:",
      ccMissed: "Lo que fallaste",
      ccReport: "Tu análisis escrito",
      ccReportHint: "Elige un partido que hayas visto. Describe un problema que viste, las pruebas (momentos, números) y la sesión que harías para corregirlo. Al menos {n} palabras.",
      ccWords: "{n} palabras", ccNeedWords: "Escribe al menos {n} palabras en tu análisis.",
      ccDownload: "Guardar certificado", ccCode: "Código de referencia: {code}",
      ccEnglishOnly: "Las preguntas están en inglés por ahora.",
      ccCertHead: "Certificación", ccAwardedTo: "Otorgado a", ccAthlete: "Deportista de LJSportMind",
      ccCertFoot: "Prueba de habilidades de LJSportMind · no es una licencia oficial de entrenador",
      evCert: "LJ Coach {level} aprobado ({score}/10)",
      proofHave: "Prueba: LJ Coach {level} ✓ · {code}",
      proofTake: "Demuéstralo: haz el LJ Coach nivel {n} →",
      planCert: "Aprueba el LJ Coach {name}."
    },
    zh: {
      ccWatch: "观看官方集锦 ↗", ccFacts: "真实瞬间只采用已发表比赛报道一致认可的事实。",
      ccUnlock: "你的认证解锁了什么", ccSkillsProven: "已认证技能", ccCareers: "它支持的职业方向", ccLinkedIn: "添加到 LinkedIn", ccCertSkills: "已认证技能：{skills}", ccIssued: "颁发于 {date} · 证书编号 {code}", ccJobs: "查找职位：",
      ccTitle: "LJ 教练认证",
      ccSub: "三个级别的足球执教与比赛分析测试。通过一个级别即可为护照添加证明：相关技能计入职业匹配，计划步骤自动勾选，并获得可分享的证书。",
      ccNotLicence: "这是 LJSportMind 的技能测试，不是官方教练执照。请与你所在足协的执照搭配（例如 US Soccer Grassroots）。",
      ccL1: "第 1 级 · 基础", ccL1d: "比赛原则、阵型、训练课和教练每天使用的规则。",
      ccL2: "第 2 级 · 战术分析", ccL2d: "非常难。来自职业比赛的真实瞬间：逼抢、后场出球、比赛局势和场上调整。",
      ccL3: "第 3 级 · 比赛分析", ccL3d: "非常难。任何分析师岗位都会用到的数据推理：样本、偏差、基础概率、xG 和 PPDA，以及向决策者提出建议，并提交一篇书面分析。",
      ccRule: "10 道题 · 答对 {pass} 道通过 · 10 分钟后可重考",
      ccStart: "开始第 {n} 级", ccLocked: "请先通过第 {n} 级", ccWait: "{n} 分钟后再试",
      ccPassed: "已通过 {score}/10 · {date}", ccSubmit: "提交答案", ccCancel: "取消",
      ccAnswerAll: "请先回答所有问题。",
      ccPassMsg: "已通过：{score}/10。{level}现已成为你护照上的证明。",
      ccFailMsg: "{score}/10。需要答对 {pass} 道才能通过。请复习以下内容，{min} 分钟后再试：",
      ccMissed: "你答错的题",
      ccReport: "你的书面分析",
      ccReportHint: "选择一场你看过的比赛。描述你看到的一个问题、证据（具体时刻、数据），以及你会安排的纠正训练。至少 {n} 个词。",
      ccWords: "{n} 个词", ccNeedWords: "分析至少写 {n} 个词。",
      ccDownload: "保存证书", ccCode: "参考编号：{code}",
      ccEnglishOnly: "题目目前为英文。",
      ccCertHead: "认证证书", ccAwardedTo: "授予", ccAthlete: "LJSportMind 运动员",
      ccCertFoot: "LJSportMind 技能测试 · 非官方教练执照",
      evCert: "已通过 LJ Coach {level}（{score}/10）",
      proofHave: "证明：LJ Coach {level} ✓ · {code}",
      proofTake: "证明自己：参加 LJ Coach 第 {n} 级 →",
      planCert: "通过 LJ Coach {name}。"
    },
    ar: {
      ccWatch: "شاهد الملخص الرسمي ↗", ccFacts: "تعتمد اللحظات الحقيقية فقط على حقائق تتفق عليها تقارير المباريات المنشورة.",
      ccUnlock: "ما تفتحه لك شهادتك", ccSkillsProven: "المهارات المعتمدة", ccCareers: "المسارات المهنية التي تدعمها", ccLinkedIn: "أضف إلى LinkedIn", ccCertSkills: "المهارات المعتمدة: {skills}", ccIssued: "صدرت في {date} · رقم الشهادة {code}", ccJobs: "ابحث عن وظائف:",
      ccTitle: "شهادة LJ Coach",
      ccSub: "ثلاثة مستويات في التدريب وتحليل مباريات كرة القدم. اجتز مستوى لتضيف إثباتًا إلى جوازك: تُحتسب المهارات في المسارات المناسبة، وتُعلَّم خطوات الخطة، وتحصل على شهادة تشاركها.",
      ccNotLicence: "اختبار مهارات من LJSportMind، وليس رخصة تدريب رسمية. اجمعه مع رخصة اتحادك (مثل US Soccer Grassroots).",
      ccL1: "المستوى 1 · الأساسيات", ccL1d: "مبادئ اللعب والخطط والحصص التدريبية والقوانين التي يستخدمها المدربون يوميًا.",
      ccL2: "المستوى 2 · التحليل التكتيكي", ccL2d: "صعب جدًا. لحظات حقيقية من مباريات احترافية: الضغط وبناء اللعب وحالة المباراة والتغييرات أثناء اللعب.",
      ccL3: "المستوى 3 · تحليل المباريات", ccL3d: "صعب جدًا. تفكير بالبيانات يُستخدم في أي وظيفة محلل: العينات والتحيز والمعدلات الأساسية وxG وPPDA وتقديم المشورة لصانعي القرار، مع تحليل مكتوب.",
      ccRule: "10 أسئلة · النجاح بـ {pass} · الإعادة بعد 10 دقائق",
      ccStart: "ابدأ المستوى {n}", ccLocked: "اجتز المستوى {n} أولًا", ccWait: "حاول مجددًا بعد {n} د",
      ccPassed: "ناجح {score}/10 · {date}", ccSubmit: "أرسل الإجابات", ccCancel: "إلغاء",
      ccAnswerAll: "أجب عن كل الأسئلة أولًا.",
      ccPassMsg: "ناجح: {score}/10. أصبح {level} إثباتًا في جوازك.",
      ccFailMsg: "{score}/10. تحتاج إلى {pass} للنجاح. راجع هذه المواضيع وحاول مجددًا بعد {min} دقائق:",
      ccMissed: "ما أخطأت فيه",
      ccReport: "تحليلك المكتوب",
      ccReportHint: "اختر مباراة شاهدتها. صف مشكلة رأيتها، والدليل (لحظات، أرقام)، والحصة التدريبية التي ستقيمها لحلها. {n} كلمة على الأقل.",
      ccWords: "{n} كلمة", ccNeedWords: "اكتب {n} كلمة على الأقل في تحليلك.",
      ccDownload: "احفظ الشهادة", ccCode: "الرمز المرجعي: {code}",
      ccEnglishOnly: "الأسئلة باللغة الإنجليزية حاليًا.",
      ccCertHead: "شهادة", ccAwardedTo: "تُمنح إلى", ccAthlete: "رياضي LJSportMind",
      ccCertFoot: "اختبار مهارات من LJSportMind · ليس رخصة تدريب رسمية",
      evCert: "اجتاز LJ Coach {level} ({score}/10)",
      proofHave: "إثبات: LJ Coach {level} ✓ · {code}",
      proofTake: "أثبت ذلك: خض LJ Coach المستوى {n} ←",
      planCert: "اجتز LJ Coach {name}."
    },
    fr: {
      ccWatch: "Voir le résumé officiel ↗", ccFacts: "Les vrais moments n'utilisent que des faits sur lesquels les comptes rendus publiés s'accordent.",
      ccUnlock: "Ce que ta certification débloque", ccSkillsProven: "Compétences certifiées", ccCareers: "Métiers qu'elle soutient", ccLinkedIn: "Ajouter à LinkedIn", ccCertSkills: "Compétences certifiées : {skills}", ccIssued: "Délivrée le {date} · ID {code}", ccJobs: "Trouver des offres :",
      ccTitle: "Certification LJ Coach",
      ccSub: "Trois niveaux d'entraînement et d'analyse de match en football. Réussis un niveau pour ajouter une preuve à ton Passeport : les compétences comptent dans tes métiers compatibles, les étapes du plan se cochent et tu obtiens un certificat à partager.",
      ccNotLicence: "Un test de compétences LJSportMind, pas un diplôme officiel d'entraîneur. Complète-le avec le diplôme de ta fédération (par exemple US Soccer Grassroots).",
      ccL1: "Niveau 1 · Fondamentaux", ccL1d: "Principes de jeu, systèmes, séances et lois que les entraîneurs utilisent chaque jour.",
      ccL2: "Niveau 2 · Analyse tactique", ccL2d: "Très difficile. De vrais moments de matchs professionnels : pressing, relance, contexte du match et ajustements en cours de jeu.",
      ccL3: "Niveau 3 · Analyse de match", ccL3d: "Très difficile. Le raisonnement sur les données utilisé dans tout poste d'analyste : échantillons, biais, taux de base, xG et PPDA, et conseil aux décideurs, plus une analyse écrite.",
      ccRule: "10 questions · réussite à {pass} · nouvel essai après 10 minutes",
      ccStart: "Commencer le niveau {n}", ccLocked: "Réussis d'abord le niveau {n}", ccWait: "Réessaie dans {n} min",
      ccPassed: "Réussi {score}/10 · {date}", ccSubmit: "Envoyer mes réponses", ccCancel: "Annuler",
      ccAnswerAll: "Réponds d'abord à toutes les questions.",
      ccPassMsg: "Réussi : {score}/10. {level} est maintenant une preuve sur ton Passeport.",
      ccFailMsg: "{score}/10. Il faut {pass} pour réussir. Revois ces thèmes et réessaie dans {min} minutes :",
      ccMissed: "Ce que tu as manqué",
      ccReport: "Ton analyse écrite",
      ccReportHint: "Choisis un match que tu as regardé. Décris un problème observé, les preuves (moments, chiffres) et la séance que tu ferais pour le corriger. Au moins {n} mots.",
      ccWords: "{n} mots", ccNeedWords: "Écris au moins {n} mots pour ton analyse.",
      ccDownload: "Enregistrer le certificat", ccCode: "Code de référence : {code}",
      ccEnglishOnly: "Les questions sont en anglais pour l'instant.",
      ccCertHead: "Certification", ccAwardedTo: "Décerné à", ccAthlete: "Sportif LJSportMind",
      ccCertFoot: "Test de compétences LJSportMind · pas un diplôme officiel d'entraîneur",
      evCert: "LJ Coach {level} réussi ({score}/10)",
      proofHave: "Preuve : LJ Coach {level} ✓ · {code}",
      proofTake: "Prouve-le : passe le LJ Coach niveau {n} →",
      planCert: "Réussir le LJ Coach {name}."
    },
    pt: {
      ccWatch: "Ver os melhores momentos oficiais ↗", ccFacts: "Os momentos reais usam apenas fatos em que as reportagens publicadas concordam.",
      ccUnlock: "O que sua certificação desbloqueia", ccSkillsProven: "Habilidades certificadas", ccCareers: "Opções de carreira que ela apoia", ccLinkedIn: "Adicionar ao LinkedIn", ccCertSkills: "Habilidades certificadas: {skills}", ccIssued: "Emitida em {date} · ID da credencial {code}", ccJobs: "Buscar vagas:",
      ccTitle: "Certificação LJ Coach",
      ccSub: "Três níveis de treino e análise de jogo no futebol. Passe em um nível para adicionar uma prova ao seu Passaporte: as habilidades contam nas suas funções compatíveis, os passos do plano são marcados e você recebe um certificado para compartilhar.",
      ccNotLicence: "Um teste de habilidades do LJSportMind, não uma licença oficial de treinador. Combine com a licença da sua federação (por exemplo US Soccer Grassroots).",
      ccL1: "Nível 1 · Fundamentos", ccL1d: "Princípios de jogo, sistemas, sessões e as regras que os treinadores usam todos os dias.",
      ccL2: "Nível 2 · Análise tática", ccL2d: "Muito difícil. Momentos reais de jogos profissionais: pressão, saída de bola, contexto do jogo e mudanças durante a partida.",
      ccL3: "Nível 3 · Análise de jogo", ccL3d: "Muito difícil. Raciocínio com dados usado em qualquer função de analista: amostras, vieses, taxas de base, xG e PPDA, e orientação a quem decide, mais uma análise escrita.",
      ccRule: "10 perguntas · aprovação com {pass} · nova tentativa após 10 minutos",
      ccStart: "Começar o nível {n}", ccLocked: "Passe primeiro no nível {n}", ccWait: "Tente de novo em {n} min",
      ccPassed: "Aprovado {score}/10 · {date}", ccSubmit: "Enviar respostas", ccCancel: "Cancelar",
      ccAnswerAll: "Responda todas as perguntas primeiro.",
      ccPassMsg: "Aprovado: {score}/10. {level} agora é uma prova no seu Passaporte.",
      ccFailMsg: "{score}/10. Você precisa de {pass} para passar. Revise estes temas e tente de novo em {min} minutos:",
      ccMissed: "O que você errou",
      ccReport: "Sua análise escrita",
      ccReportHint: "Escolha um jogo que você assistiu. Descreva um problema que viu, as evidências (momentos, números) e o treino que faria para corrigi-lo. Pelo menos {n} palavras.",
      ccWords: "{n} palavras", ccNeedWords: "Escreva pelo menos {n} palavras na sua análise.",
      ccDownload: "Salvar certificado", ccCode: "Código de referência: {code}",
      ccEnglishOnly: "As perguntas estão em inglês por enquanto.",
      ccCertHead: "Certificação", ccAwardedTo: "Concedido a", ccAthlete: "Atleta LJSportMind",
      ccCertFoot: "Teste de habilidades do LJSportMind · não é uma licença oficial de treinador",
      evCert: "LJ Coach {level} aprovado ({score}/10)",
      proofHave: "Prova: LJ Coach {level} ✓ · {code}",
      proofTake: "Prove: faça o LJ Coach nível {n} →",
      planCert: "Passar no LJ Coach {name}."
    },
    de: {
      ccWatch: "Offizielle Highlights ansehen ↗", ccFacts: "Echte Momente nutzen nur Fakten, in denen veröffentlichte Spielberichte übereinstimmen.",
      ccUnlock: "Was deine Zertifizierung freischaltet", ccSkillsProven: "Zertifizierte Fähigkeiten", ccCareers: "Berufe, die sie unterstützt", ccLinkedIn: "Zu LinkedIn hinzufügen", ccCertSkills: "Zertifizierte Fähigkeiten: {skills}", ccIssued: "Ausgestellt am {date} · Nachweis-ID {code}", ccJobs: "Stellen finden:",
      ccTitle: "LJ Coach Zertifizierung",
      ccSub: "Drei Stufen Fußballtraining und Spielanalyse. Bestehe eine Stufe, um deinem Pass einen Nachweis hinzuzufügen: Die Fähigkeiten zählen bei deinen passenden Berufen, Planschritte werden abgehakt und du bekommst ein Zertifikat zum Teilen.",
      ccNotLicence: "Ein LJSportMind-Kompetenztest, keine offizielle Trainerlizenz. Kombiniere ihn mit der Lizenz deines Verbands (zum Beispiel US Soccer Grassroots).",
      ccL1: "Stufe 1 · Grundlagen", ccL1d: "Spielprinzipien, Systeme, Trainingseinheiten und die Regeln, die Trainer täglich nutzen.",
      ccL2: "Stufe 2 · Taktikanalyse", ccL2d: "Sehr schwer. Echte Momente aus Profispielen: Pressing, Spielaufbau, Spielstand und Anpassungen während des Spiels.",
      ccL3: "Stufe 3 · Spielanalyse", ccL3d: "Sehr schwer. Datenkompetenz für jede Analystenstelle: Stichproben, Verzerrungen, Basisraten, xG und PPDA sowie Beratung von Entscheidern, plus eine schriftliche Analyse.",
      ccRule: "10 Fragen · bestanden ab {pass} · neuer Versuch nach 10 Minuten",
      ccStart: "Stufe {n} starten", ccLocked: "Bestehe zuerst Stufe {n}", ccWait: "Neuer Versuch in {n} Min.",
      ccPassed: "Bestanden {score}/10 · {date}", ccSubmit: "Antworten senden", ccCancel: "Abbrechen",
      ccAnswerAll: "Beantworte zuerst alle Fragen.",
      ccPassMsg: "Bestanden: {score}/10. {level} ist jetzt ein Nachweis in deinem Pass.",
      ccFailMsg: "{score}/10. Du brauchst {pass} zum Bestehen. Wiederhole diese Themen und versuche es in {min} Minuten erneut:",
      ccMissed: "Was du verpasst hast",
      ccReport: "Deine schriftliche Analyse",
      ccReportHint: "Wähle ein Spiel, das du gesehen hast. Beschreibe ein Problem, die Belege (Momente, Zahlen) und die Trainingseinheit, mit der du es beheben würdest. Mindestens {n} Wörter.",
      ccWords: "{n} Wörter", ccNeedWords: "Schreibe mindestens {n} Wörter für deine Analyse.",
      ccDownload: "Zertifikat speichern", ccCode: "Referenzcode: {code}",
      ccEnglishOnly: "Die Fragen sind vorerst auf Englisch.",
      ccCertHead: "Zertifizierung", ccAwardedTo: "Verliehen an", ccAthlete: "LJSportMind-Sportler",
      ccCertFoot: "LJSportMind-Kompetenztest · keine offizielle Trainerlizenz",
      evCert: "LJ Coach {level} bestanden ({score}/10)",
      proofHave: "Nachweis: LJ Coach {level} ✓ · {code}",
      proofTake: "Beweise es: mach den LJ Coach Stufe {n} →",
      planCert: "LJ Coach {name} bestehen."
    },
    it: {
      ccWatch: "Guarda gli highlights ufficiali ↗", ccFacts: "I momenti reali usano solo fatti su cui concordano le cronache pubblicate.",
      ccUnlock: "Cosa sblocca la tua certificazione", ccSkillsProven: "Competenze certificate", ccCareers: "Ruoli che supporta", ccLinkedIn: "Aggiungi a LinkedIn", ccCertSkills: "Competenze certificate: {skills}", ccIssued: "Rilasciata il {date} · ID credenziale {code}", ccJobs: "Trova offerte:",
      ccTitle: "Certificazione LJ Coach",
      ccSub: "Tre livelli di allenamento e analisi della partita nel calcio. Supera un livello per aggiungere una prova al tuo Passaporto: le competenze contano nei ruoli compatibili, i passi del piano si spuntano e ricevi un certificato da condividere.",
      ccNotLicence: "Un test di competenze LJSportMind, non una licenza ufficiale da allenatore. Abbinalo alla licenza della tua federazione (ad esempio US Soccer Grassroots).",
      ccL1: "Livello 1 · Fondamenti", ccL1d: "Principi di gioco, moduli, sedute e le regole che gli allenatori usano ogni giorno.",
      ccL2: "Livello 2 · Analisi tattica", ccL2d: "Molto difficile. Momenti reali di partite professionistiche: pressing, costruzione, contesto della partita e cambi durante il gioco.",
      ccL3: "Livello 3 · Analisi della partita", ccL3d: "Molto difficile. Il ragionamento sui dati usato in ogni ruolo da analista: campioni, bias, tassi di base, xG e PPDA, e consigli a chi decide, più un'analisi scritta.",
      ccRule: "10 domande · si supera con {pass} · nuovo tentativo dopo 10 minuti",
      ccStart: "Inizia il livello {n}", ccLocked: "Supera prima il livello {n}", ccWait: "Riprova tra {n} min",
      ccPassed: "Superato {score}/10 · {date}", ccSubmit: "Invia le risposte", ccCancel: "Annulla",
      ccAnswerAll: "Rispondi prima a tutte le domande.",
      ccPassMsg: "Superato: {score}/10. {level} ora è una prova sul tuo Passaporto.",
      ccFailMsg: "{score}/10. Servono {pass} per superarlo. Ripassa questi argomenti e riprova tra {min} minuti:",
      ccMissed: "Cosa hai sbagliato",
      ccReport: "La tua analisi scritta",
      ccReportHint: "Scegli una partita che hai visto. Descrivi un problema che hai notato, le prove (momenti, numeri) e la seduta che faresti per risolverlo. Almeno {n} parole.",
      ccWords: "{n} parole", ccNeedWords: "Scrivi almeno {n} parole per la tua analisi.",
      ccDownload: "Salva il certificato", ccCode: "Codice di riferimento: {code}",
      ccEnglishOnly: "Per ora le domande sono in inglese.",
      ccCertHead: "Certificazione", ccAwardedTo: "Assegnato a", ccAthlete: "Atleta LJSportMind",
      ccCertFoot: "Test di competenze LJSportMind · non è una licenza ufficiale da allenatore",
      evCert: "LJ Coach {level} superato ({score}/10)",
      proofHave: "Prova: LJ Coach {level} ✓ · {code}",
      proofTake: "Dimostralo: fai il LJ Coach livello {n} →",
      planCert: "Supera il LJ Coach {name}."
    },
    hi: {
      ccWatch: "आधिकारिक हाइलाइट्स देखें ↗", ccFacts: "असली पलों में सिर्फ़ वही तथ्य हैं जिन पर प्रकाशित मैच रिपोर्टें सहमत हैं।",
      ccUnlock: "आपका प्रमाणन क्या खोलता है", ccSkillsProven: "प्रमाणित कौशल", ccCareers: "किन करियर विकल्पों में मदद करता है", ccLinkedIn: "LinkedIn में जोड़ें", ccCertSkills: "प्रमाणित कौशल: {skills}", ccIssued: "जारी: {date} · क्रेडेंशियल ID {code}", ccJobs: "नौकरियाँ खोजें:",
      ccTitle: "LJ Coach प्रमाणन",
      ccSub: "फ़ुटबॉल कोचिंग और मैच विश्लेषण के तीन स्तर। कोई स्तर पास करें और अपने पासपोर्ट में सबूत जोड़ें: कौशल आपके करियर मिलान में गिने जाते हैं, प्लान के कदम अपने आप टिक होते हैं, और आपको शेयर करने लायक प्रमाणपत्र मिलता है।",
      ccNotLicence: "यह LJSportMind का कौशल टेस्ट है, कोई आधिकारिक कोचिंग लाइसेंस नहीं। इसे अपने फ़ेडरेशन के लाइसेंस (जैसे US Soccer Grassroots) के साथ जोड़ें।",
      ccL1: "स्तर 1 · बुनियाद", ccL1d: "खेल के सिद्धांत, फ़ॉर्मेशन, ट्रेनिंग सेशन और वे नियम जो कोच रोज़ इस्तेमाल करते हैं।",
      ccL2: "स्तर 2 · रणनीतिक विश्लेषण", ccL2d: "बहुत कठिन। प्रोफ़ेशनल मैचों के असली पल: प्रेसिंग, बिल्ड-अप, मैच की स्थिति और खेल के दौरान बदलाव।",
      ccL3: "स्तर 3 · मैच विश्लेषण", ccL3d: "बहुत कठिन। हर एनालिस्ट नौकरी में काम आने वाली डेटा सोच: सैंपल, पक्षपात, बेस रेट, xG और PPDA, और फ़ैसला लेने वालों को सलाह, साथ में एक लिखित विश्लेषण।",
      ccRule: "10 सवाल · {pass} सही पर पास · 10 मिनट बाद दोबारा",
      ccStart: "स्तर {n} शुरू करें", ccLocked: "पहले स्तर {n} पास करें", ccWait: "{n} मिनट बाद फिर कोशिश करें",
      ccPassed: "पास {score}/10 · {date}", ccSubmit: "जवाब भेजें", ccCancel: "रद्द करें",
      ccAnswerAll: "पहले सभी सवालों के जवाब दें।",
      ccPassMsg: "पास: {score}/10। {level} अब आपके पासपोर्ट पर सबूत है।",
      ccFailMsg: "{score}/10। पास होने के लिए {pass} चाहिए। ये विषय दोहराएँ और {min} मिनट बाद फिर कोशिश करें:",
      ccMissed: "आपसे क्या छूटा",
      ccReport: "आपका लिखित विश्लेषण",
      ccReportHint: "कोई देखा हुआ मैच चुनें। एक समस्या, उसका सबूत (पल, आँकड़े) और उसे सुधारने वाला ट्रेनिंग सेशन लिखें। कम से कम {n} शब्द।",
      ccWords: "{n} शब्द", ccNeedWords: "अपने विश्लेषण में कम से कम {n} शब्द लिखें।",
      ccDownload: "प्रमाणपत्र सेव करें", ccCode: "संदर्भ कोड: {code}",
      ccEnglishOnly: "फ़िलहाल सवाल अंग्रेज़ी में हैं।",
      ccCertHead: "प्रमाणन", ccAwardedTo: "प्रदान किया गया", ccAthlete: "LJSportMind खिलाड़ी",
      ccCertFoot: "LJSportMind कौशल टेस्ट · आधिकारिक कोचिंग लाइसेंस नहीं",
      evCert: "LJ Coach {level} पास ({score}/10)",
      proofHave: "सबूत: LJ Coach {level} ✓ · {code}",
      proofTake: "साबित करें: LJ Coach स्तर {n} दें →",
      planCert: "LJ Coach {name} पास करें।"
    },
    ja: {
      ccWatch: "公式ハイライトを見る ↗", ccFacts: "実際の場面は、公開された試合レポートで一致している事実のみを使っています。",
      ccUnlock: "認定で開ける道", ccSkillsProven: "認定スキル", ccCareers: "活かせるキャリア", ccLinkedIn: "LinkedInに追加", ccCertSkills: "認定スキル：{skills}", ccIssued: "発行日 {date}・認定ID {code}", ccJobs: "求人を探す：",
      ccTitle: "LJ Coach認定",
      ccSub: "サッカーの指導と試合分析の3つのレベル。レベルに合格するとパスポートに証明が加わります。スキルが職種マッチに反映され、プランのステップに自動でチェックが入り、共有できる修了証がもらえます。",
      ccNotLicence: "LJSportMindのスキルチェックであり、公式の指導者ライセンスではありません。所属協会のライセンス（例：US Soccer Grassroots）と組み合わせましょう。",
      ccL1: "レベル1・基礎", ccL1d: "プレー原則、フォーメーション、トレーニングと、指導者が毎日使うルール。",
      ccL2: "レベル2・戦術分析", ccL2d: "非常に難しい。プロの試合の実際の場面から：プレス、ビルドアップ、試合状況、試合中の修正。",
      ccL3: "レベル3・試合分析", ccL3d: "非常に難しい。どの分析職でも使うデータ思考：サンプル、バイアス、基準率、xGとPPDA、意思決定者への助言、そして分析レポート。",
      ccRule: "10問・{pass}問正解で合格・10分後に再挑戦",
      ccStart: "レベル{n}を始める", ccLocked: "先にレベル{n}に合格", ccWait: "{n}分後に再挑戦",
      ccPassed: "合格 {score}/10・{date}", ccSubmit: "回答を送信", ccCancel: "キャンセル",
      ccAnswerAll: "先にすべての問題に答えてください。",
      ccPassMsg: "合格：{score}/10。{level}がパスポートの証明になりました。",
      ccFailMsg: "{score}/10。合格には{pass}問の正解が必要です。次のテーマを復習して、{min}分後に再挑戦しましょう：",
      ccMissed: "間違えた問題",
      ccReport: "あなたの分析レポート",
      ccReportHint: "観た試合を1つ選び、見つけた課題、その根拠（場面や数字）、改善のためのトレーニングを書きましょう。{n}語以上。",
      ccWords: "{n}語", ccNeedWords: "分析は{n}語以上書いてください。",
      ccDownload: "修了証を保存", ccCode: "参照コード：{code}",
      ccEnglishOnly: "問題は現在英語のみです。",
      ccCertHead: "認定証", ccAwardedTo: "授与先", ccAthlete: "LJSportMindアスリート",
      ccCertFoot: "LJSportMindスキルチェック・公式指導者ライセンスではありません",
      evCert: "LJ Coach {level} 合格（{score}/10）",
      proofHave: "証明：LJ Coach {level} ✓・{code}",
      proofTake: "証明しよう：LJ Coach レベル{n}に挑戦 →",
      planCert: "LJ Coach {name}に合格する。"
    }
  };
  Object.keys(I18N_CERT).forEach((lang) => (I18N[lang] = Object.assign(I18N[lang] || {}, I18N_CERT[lang])));

  const card = document.getElementById("certCard");
  let active = null; // { level, questions: [{ q, order }] } while a test is open
  let lastResult = null; // { level, pass, score, missed: [...] } shown until the next test starts

  const qText = (q) => q[currentLang] || q.en;
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const day = (iso) => new Date(iso).toLocaleDateString(currentLang);

  function waitMinutes(data, level) {
    const at = data && data.certAttempts && data.certAttempts[level];
    if (!at) return 0;
    const left = CERT_COOLDOWN_MIN - (Date.now() - new Date(at).getTime()) / 60000;
    return left > 0 ? Math.ceil(left) : 0;
  }

  function startTest(level) {
    active = { level, questions: shuffle(CERT_QUESTIONS[level]).map((q) => ({ q, order: shuffle([1, 2, 3, 4]) })) };
    lastResult = null;
    renderCerts(loadPassport());
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submitTest(form) {
    const data = loadPassport();
    const { level, questions } = active;
    const picks = questions.map((_, i) => form.querySelector(`input[name="cq${i}"]:checked`));
    const note = form.querySelector(".cert-form-msg");
    if (picks.some((p) => !p)) {
      note.textContent = t("ccAnswerAll");
      return;
    }
    let report = "";
    if (CERT_LEVELS[level - 1].report) {
      report = form.querySelector("textarea").value.trim();
      if (certWordCount(report) < CERT_REPORT_WORDS) {
        note.textContent = tf("ccNeedWords", { n: CERT_REPORT_WORDS });
        return;
      }
    }
    const missed = questions.filter((item, i) => Number(picks[i].value) !== 1).map((item) => item.q);
    const score = questions.length - missed.length;
    const pass = score >= CERT_LEVELS[level - 1].pass;
    const at = new Date().toISOString();
    active = null;
    lastResult = { level, pass, score, missed };
    updatePassport((d) => {
      if (pass) {
        const cert = { level, score, at, code: certCode(d, level, score, at) };
        if (report) cert.report = report;
        d.certs = (d.certs || []).filter((c) => c.level !== level).concat(cert);
        if (d.certAttempts) delete d.certAttempts[level];
      } else {
        d.certAttempts = Object.assign({}, d.certAttempts, { [level]: at });
      }
    });
    card.scrollIntoView({ behavior: "smooth", block: "start" });
    return data;
  }

  // A shareable certificate image, drawn on a canvas so it can be saved as a PNG.
  function drawCertificate(cert, data) {
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 800;
    const g = c.getContext("2d");
    const font = (size, weight = 600) => `${weight} ${size}px "Space Grotesk", "Inter", system-ui, sans-serif`;
    g.fillStyle = "#07080b";
    g.fillRect(0, 0, c.width, c.height);
    const gold = g.createLinearGradient(0, 0, c.width, c.height);
    gold.addColorStop(0, "#f6e1a6");
    gold.addColorStop(0.4, "#e9c77b");
    gold.addColorStop(1, "#9c6f2f");
    g.strokeStyle = gold;
    g.lineWidth = 6;
    g.strokeRect(36, 36, c.width - 72, c.height - 72);
    g.lineWidth = 1.5;
    g.strokeRect(54, 54, c.width - 108, c.height - 108);
    g.textAlign = "center";
    g.fillStyle = gold;
    g.font = font(26, 700);
    g.fillText("LJSPORTMIND", c.width / 2, 130);
    g.fillStyle = "#9da1ab";
    g.font = font(24, 500);
    g.fillText(t("ccCertHead"), c.width / 2, 180);
    g.fillStyle = "#f3f1ea";
    g.font = font(64, 700);
    g.fillText(t("ccTitle"), c.width / 2, 270);
    g.fillStyle = gold;
    g.font = font(36, 600);
    g.fillText(t(CERT_LEVELS[cert.level - 1].name), c.width / 2, 330);
    g.fillStyle = "#9da1ab";
    g.font = font(24, 500);
    g.fillText(t("ccAwardedTo"), c.width / 2, 420);
    g.fillStyle = "#f3f1ea";
    g.font = font(52, 700);
    g.fillText((data && data.name) || t("ccAthlete"), c.width / 2, 485);
    g.fillStyle = "#c9cbd1";
    g.font = font(24, 500);
    g.fillText(tf("ccCertSkills", { skills: certLevelSkills(cert.level).join(" · ") }), c.width / 2, 548);
    g.fillText(`${cert.score}/10 · ${day(cert.at)}`, c.width / 2, 590);
    g.fillStyle = gold;
    g.font = font(30, 700);
    g.fillText(cert.code, c.width / 2, 645);
    g.fillStyle = "#6f737c";
    g.font = font(20, 500);
    g.fillText(t("ccCertFoot"), c.width / 2, 700);
    return c;
  }

  function certificateBlock(cert, data) {
    const wrap = el("div", "cert-certificate");
    const canvas = drawCertificate(cert, data);
    canvas.className = "cert-canvas";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `${t("ccTitle")} · ${t(CERT_LEVELS[cert.level - 1].name)} · ${cert.code}`);
    const save = el("button", "secondary", t("ccDownload"));
    save.type = "button";
    save.addEventListener("click", () => {
      const a = document.createElement("a");
      a.download = `LJ-Coach-Check-Level-${cert.level}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    });
    const at = new Date(cert.at);
    const linkedin = el("a", "btn-ghost cert-linkedin", t("ccLinkedIn"));
    linkedin.href = "https://www.linkedin.com/profile/add?" + new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: `${t("ccTitle")} · ${t(CERT_LEVELS[cert.level - 1].name)}`,
      organizationName: "LJSportMind",
      issueYear: String(at.getFullYear()),
      issueMonth: String(at.getMonth() + 1),
      certId: cert.code
    });
    linkedin.target = "_blank";
    linkedin.rel = "noopener noreferrer";
    const actions = el("div", "actions");
    actions.append(save, linkedin);
    wrap.append(canvas, el("p", "cert-code", tf("ccIssued", { date: day(cert.at), code: cert.code })), actions);
    return wrap;
  }

  // After any pass: the skills now certified, and how each supported career path matches right now,
  // with a target-role button and job searches. It reads the same matching the career cards use.
  function renderUnlocks(data) {
    const certs = loadCerts(data);
    if (!certs.length) return null;
    const box = el("div", "cert-unlocks");
    box.append(el("h4", "", t("ccUnlock")));
    const skills = [...new Set(certs.flatMap((c) => certLevelSkills(c.level)))];
    const chips = el("div", "cert-skill-chips");
    skills.forEach((label) => chips.append(el("span", "cert-skill", `✓ ${label}`)));
    box.append(el("p", "detail-label", t("ccSkillsProven")), chips, el("p", "detail-label", t("ccCareers")));
    const eff = effectiveProfile(data);
    const have = [...eff.skills, ...eff.interests, ...(GOAL_TAGS[data.goal] || [])];
    const list = el("div", "cert-careers");
    CERT_ROLES.map((idx) => {
      const path = pathByIdx(idx);
      const matched = path.tags.filter((tg) => have.includes(tg));
      return { ...path, idx, matched };
    }).sort((a, b) => b.matched.length / b.tags.length - a.matched.length / a.tags.length).forEach((m) => {
      const row = el("div", "cert-career");
      const key = matchStrengthKey(m);
      const head = el("div", "match-top");
      head.append(el("strong", "", m.name), el("span", `match-badge ${key}`, t(key)));
      const covers = el("p", "match-covers", tf("matchCovers", { have: m.matched.length, total: m.tags.length }));
      const jobs = el("p", "job-links");
      jobs.innerHTML = `${esc(t("ccJobs"))} ${linksToHTML(jobSearchLinks(JOB_QUERIES[m.idx], data.location))}`;
      const isTarget = !!(data.plan && data.plan.roleIdx === m.idx);
      const target = el("button", isTarget ? "secondary" : "", t(isTarget ? "isTarget" : "setTarget"));
      target.type = "button";
      target.disabled = isTarget;
      target.addEventListener("click", () => setTargetRole(m.idx));
      row.append(head, covers, jobs, target);
      list.append(row);
    });
    box.append(list);
    return box;
  }

  function renderResult(data) {
    const r = lastResult;
    const box = el("div", `cert-result ${r.pass ? "pass" : "fail"}`);
    if (r.pass) {
      box.append(el("p", "cert-result-head", tf("ccPassMsg", { score: r.score, level: t(CERT_LEVELS[r.level - 1].name) })));
      if (r.missed.length) {
        box.append(el("p", "detail-label", t("ccMissed")));
        const ul = el("ul", "cert-missed");
        r.missed.forEach((q) => {
          const [question, answer, , , , why] = qText(q);
          const li = el("li");
          li.append(el("strong", "", question), el("span", "", ` ${answer}. ${why}`));
          ul.append(li);
        });
        box.append(ul);
      }
      const cert = loadCerts(data).find((c) => c.level === r.level);
      if (cert) box.append(certificateBlock(cert, data));
      const unlocks = renderUnlocks(data);
      if (unlocks) box.append(unlocks);
    } else {
      box.append(el("p", "cert-result-head", tf("ccFailMsg", { score: r.score, pass: CERT_LEVELS[r.level - 1].pass, min: CERT_COOLDOWN_MIN })));
      const ul = el("ul", "cert-missed");
      r.missed.forEach((q) => ul.append(el("li", "", qText(q)[0])));
      box.append(ul);
    }
    return box;
  }

  function renderTest() {
    const { level, questions } = active;
    const form = el("form", "cert-form");
    form.noValidate = true;
    form.append(el("h4", "", t(CERT_LEVELS[level - 1].name)));
    if (!["en", "es"].includes(currentLang)) form.append(el("p", "section-sub", t("ccEnglishOnly")));
    if (level > 1) form.append(el("p", "cert-note", t("ccFacts")));
    questions.forEach((item, i) => {
      const parts = qText(item.q);
      const set = el("fieldset", "cert-q");
      set.append(el("legend", "", `${i + 1}. ${parts[0]}`));
      if (item.q.watch) {
        const watch = el("a", "cert-watch", t("ccWatch"));
        watch.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(item.q.watch);
        watch.target = "_blank";
        watch.rel = "noopener noreferrer";
        set.append(watch);
      }
      item.order.forEach((opt) => {
        const label = el("label", "cert-opt");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `cq${i}`;
        input.value = String(opt);
        label.append(input, el("span", "", parts[opt]));
        set.append(label);
      });
      form.append(set);
    });
    if (CERT_LEVELS[level - 1].report) {
      const field = el("div", "field");
      const id = "certReport";
      const label = el("label", "", t("ccReport"));
      label.htmlFor = id;
      const area = document.createElement("textarea");
      area.id = id;
      area.rows = 7;
      area.dir = "auto";
      const count = el("p", "cert-count", tf("ccWords", { n: 0 }));
      area.addEventListener("input", () => (count.textContent = tf("ccWords", { n: certWordCount(area.value) })));
      field.append(label, el("p", "section-sub", tf("ccReportHint", { n: CERT_REPORT_WORDS })), area, count);
      form.append(field);
    }
    const msg = el("p", "cert-form-msg");
    msg.setAttribute("aria-live", "polite");
    const actions = el("div", "actions");
    const submit = el("button", "", t("ccSubmit"));
    submit.type = "submit";
    const cancel = el("button", "secondary", t("ccCancel"));
    cancel.type = "button";
    cancel.addEventListener("click", () => {
      active = null;
      renderCerts(loadPassport());
    });
    actions.append(submit, cancel);
    form.append(msg, actions);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitTest(form);
    });
    return form;
  }

  // The code stays on one line; the label around it can wrap.
  function codeLine(code) {
    const p = el("p", "cert-code");
    const [before, after] = tf("ccCode", { code: "\u0000" }).split("\u0000");
    p.append(before, el("span", "nowrap", code), after || "");
    return p;
  }

  function renderCerts(data) {
    if (!card) return;
    card.innerHTML = "";
    card.append(el("h3", "", t("ccTitle")), el("p", "section-sub", t("ccSub")), el("p", "cert-note", t("ccNotLicence")));
    const certs = loadCerts(data);
    const next = certNextLevel(data);
    const grid = el("div", "cert-levels");
    CERT_LEVELS.forEach((lv) => {
      const cert = certs.find((c) => c.level === lv.level);
      const tile = el("div", `cert-level${cert ? " passed" : ""}`);
      tile.append(el("p", "cert-level-name", t(lv.name)), el("p", "cert-level-desc", t(lv.desc)));
      if (cert) {
        tile.append(el("p", "cert-status", `✓ ${tf("ccPassed", { score: cert.score, date: day(cert.at) })}`), codeLine(cert.code));
      } else if (lv.level === next) {
        const wait = waitMinutes(data, lv.level);
        tile.append(el("p", "cert-status", tf("ccRule", { pass: lv.pass })));
        const btn = el("button", "", wait ? tf("ccWait", { n: wait }) : tf("ccStart", { n: lv.level }));
        btn.type = "button";
        btn.disabled = !!wait || !!active;
        btn.addEventListener("click", () => startTest(lv.level));
        tile.append(btn);
      } else {
        tile.append(el("p", "cert-status locked", tf("ccLocked", { n: lv.level - 1 })));
      }
      grid.append(tile);
    });
    card.append(grid);
    if (active) card.append(renderTest());
    else if (lastResult) card.append(renderResult(data));
    else if (certs.length) card.append(certificateBlock(certs[certs.length - 1], data), renderUnlocks(data));
  }

  // Passed levels change matches and the plan, so the check redraws with them.
  const renderWithoutCerts = renderPassportSummaryAndMatches;
  renderPassportSummaryAndMatches = function (data) {
    renderWithoutCerts(data);
    renderCerts(data);
  };
  document.getElementById("langSelect").addEventListener("change", () => setTimeout(() => renderCerts(loadPassport())));
  const openPassport = loadPassport();
  if (openPassport && !passportResults.hidden) renderPassportSummaryAndMatches(openPassport);
  else renderCerts(openPassport);
}
