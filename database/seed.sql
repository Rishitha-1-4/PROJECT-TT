-- =====================================================================
-- Smart Vehicle Maintenance Platform - Knowledge Base Seed Data
-- =====================================================================

USE `smart_vehicle_maintenance`;

-- Clear existing problem records to allow clean re-seeding
DELETE FROM `vehicle_problems`;

INSERT INTO `vehicle_problems` 
(`id`, `title`, `category`, `symptoms`, `possible_causes`, `affected_components`, `recommendations`, `urgency`, `consult_mechanic_note`) 
VALUES
(1, 
 'Engine Overheating', 
 'Engine Cooling',
 'Temperature gauge in red zone; steam or sweet smell from under the hood; radiator fan running at maximum speed continuously; sudden loss of engine power.',
 'Low coolant level; coolant leak from hoses or radiator; faulty thermostat stuck closed; malfunctioning radiator fan; broken water pump; blown head gasket.',
 'Radiator, Thermostat, Water Pump, Coolant Hoses, Cylinder Head Gasket, Engine Block',
 'Pull over safely and turn off the engine immediately. Do NOT open the radiator cap while the engine is hot as boiling coolant can cause severe burns. Allow engine to cool for at least 30 minutes, inspect coolant reservoir level, and top up if low.',
 'critical',
 'Stop driving immediately if steam is visible or temperature stays high. Driving with an overheated engine can cause catastrophic block warping or complete engine seizure within minutes. Tow to an authorized garage.'),

(2, 
 'Battery Not Starting / Slow Crank', 
 'Electrical System',
 'Clicking noise when turning ignition key; starter motor turns slowly or engine fails to crank; dim headlights and dashboard lights when attempting to start.',
 'Discharged or dead 12V battery; heavy corrosion on battery terminals; loose cable connections; failing alternator not recharging battery; parasitic battery drain while vehicle is parked.',
 '12V Lead-Acid / AGM Battery, Battery Terminals, Starter Motor, Alternator, Serpentine Belt',
 'Inspect battery terminals for white or blue corrosion powder. Clean with a wire brush and baking soda solution. Check cable tightness. Attempt a jump start using certified booster cables or a portable lithium starter pack.',
 'high',
 'If the car requires frequent jump starts, or the battery is older than 3 to 4 years, have a technician run an electrical load test on the battery and alternator diode circuit.'),

(3, 
 'Low Tyre Pressure / TPMS Warning', 
 'Tyres & Wheels',
 'Tyre Pressure Monitoring System (TPMS) warning lamp illuminated on cluster; visible tyre sag; vehicle pulls slightly to one side; increased rolling resistance and sluggish acceleration.',
 'Nail or puncture in tyre tread; valve stem leakage; slow bead seal leak around wheel rim; natural pressure drop caused by seasonal cold weather drops.',
 'Tyre Tread, Valve Stem, Wheel Rim, TPMS Sensor',
 'Check all four tyres and spare tyre with a calibrated digital tyre gauge when tyres are cold. Inflate to the manufacturer recommended PSI indicated on the driver side door jamb sticker (do not use max tyre sidewall pressure). Inspect tread for nails or screws.',
 'medium',
 'Visit a tyre specialist immediately if the tyre is losing more than 3-4 PSI per week, or if a puncture is situated near the tyre sidewall (sidewall punctures cannot safely be plugged).'),

(4, 
 'Brake Noise & Grinding Pedal', 
 'Braking System',
 'High-pitched metallic squeal during light braking; grinding sound or shuddering vibration felt through the brake pedal under moderate-to-heavy deceleration; longer stopping distances.',
 'Severely worn brake pads down to the metal backing plate; worn brake rotors with deep grooving; brake dust accumulation; dry or seized caliper slider pins.',
 'Brake Pads, Brake Rotors / Discs, Calipers, Slider Pins, Brake Fluid Lines',
 'Avoid heavy driving and sudden high-speed stops. Visually inspect brake pad friction lining through the wheel spokes. If the pad friction material is thinner than 3mm (1/8 inch), pads require urgent replacement.',
 'critical',
 'SAFETY WARNING: Grinding indicates metal-on-metal contact which drastically compromises braking efficiency and damages rotors. Do not drive on highways; have brakes serviced immediately by a qualified mechanic.'),

(5, 
 'Engine Warning Light (Check Engine / CEL)', 
 'Diagnostics & Emissions',
 'Check Engine Light (solid amber or flashing); possible engine hesitation, rough idle, loss of power, or vehicle entering "limp mode".',
 'Loose or cracked fuel filler cap; failing Oxygen (O2) sensor; faulty Mass Airflow (MAF) sensor; malfunctioning catalytic converter; engine cylinder misfire; vacuum hose leak.',
 'Engine Control Unit (ECU), O2 Sensors, Spark Plugs, Ignition Coils, Catalytic Converter, MAF Sensor',
 'Check that your fuel filler cap is clicked tight. If light is solid amber and car drives normally, book an OBD-II diagnostic scan soon. If the Check Engine Light is FLASHING, ease off the accelerator immediately.',
 'high',
 'A FLASHING Check Engine Light indicates severe active misfire that can melt and destroy the catalytic converter. Pull over safely and arrange towing. Have a technician read diagnostic trouble codes (DTCs).'),

(6, 
 'Poor Fuel Efficiency & Sluggish Acceleration', 
 'Fuel & Air Intake',
 'Noticeable decrease in miles per gallon (MPG) or km per litre; slow throttle response when accelerating; dark exhaust fumes or pungent fuel smell from tailpipe.',
 'Clogged engine air filter; fouled spark plugs; sticking brake caliper causing drag; under-inflated tyres; faulty engine coolant temperature sensor keeping engine in rich warmup loop; dirty fuel injectors.',
 'Air Filter, Spark Plugs, Fuel Injectors, Tyre Pressure, Oxygen Sensor',
 'Check tyre pressures and inflate to specification. Inspect the engine air filter and replace if dirty or grey. Ensure proper viscosity motor oil is being used according to your owner manual.',
 'medium',
 'If fuel economy has dropped by more than 15-20% despite regular maintenance, a workshop should inspect sensor telemetry, fuel trim values, and ignition timing.'),

(7, 
 'Engine Oil Leakage / Puddle Under Vehicle', 
 'Engine Lubrication',
 'Dark amber or black oil spots on parking floor; burning oil odor through AC vents when idling; oil level drop on the dipstick; oil pressure warning lamp illumination.',
 'Deteriorated valve cover gasket; leaking oil pan gasket or drain plug washer; loose or degraded oil filter seal; worn crankshaft front or rear main oil seals; cracked oil cooler lines.',
 'Valve Cover Gasket, Oil Pan, Drain Plug, Oil Filter O-Ring, Crankshaft Seals',
 'Check the engine oil level with the dipstick on level ground before driving. If oil level is below the minimum mark, top up with the recommended engine oil grade before starting the vehicle.',
 'high',
 'Do NOT drive if the red oil pressure light illuminates or if oil level is below the dipstick tip. Operating an engine without sufficient oil pressure causes catastrophic metal-on-metal friction and seized bearings.'),

(8, 
 'Unusual Engine Noise (Knocking, Ticking, Squealing)', 
 'Engine Mechanical',
 'Rhythmic ticking or clicking from valve cover; deep metallic knocking sound proportional to engine RPM; high-pitched screech or squeal on cold startup or during sharp turns.',
 'Low oil level or low oil pressure causing hydraulic lifter tick; worn rod bearings or piston slap; glazed, loose, or misaligned serpentine drive belt; worn belt tensioner pulley bearing.',
 'Serpentine Belt, Alternator Pulley, Water Pump Pulley, Hydraulic Lifters, Connecting Rod Bearings',
 'Check oil dipstick immediately. If the noise is a sharp squeal that changes with engine revs, inspect the serpentine belt for cracks, fraying, or belt slack. Do not spray belt dressing as a permanent repair.',
 'high',
 'Heavy internal knocking requires immediate professional evaluation. Ticking lifters due to dirty oil may be resolved with an oil flush and fresh filter, but failing bottom-end bearings will lead to engine failure if ignored.'),

(9, 
 'Transmission Slipping or Harsh Gear Shifts', 
 'Transmission & Drivetrain',
 'Engine RPM revs up without normal acceleration; delayed engagement when shifting into Drive or Reverse; clunking or harsh shuddering during gear changes; burning fluid smell.',
 'Low or degraded transmission fluid; worn clutch plates (manual) or friction bands (automatic); failing shift solenoids; clogged transmission fluid filter.',
 'Automatic / Manual Transmission, Torque Converter, Shift Solenoids, Transmission Cooler Lines',
 'Check transmission fluid level and color (if vehicle is equipped with a dipstick). Healthy fluid is clear pinkish-red; dark brown or burnt smelling fluid indicates severe thermal breakdown and contamination.',
 'high',
 'Consult an ASE-certified transmission specialist. Continuing to drive with a slipping transmission will rapidly burn remaining friction clutches, turning a minor fluid service into a full gearbox rebuild.'),

(10, 
 'Air Conditioning Blowing Warm Air', 
 'Climate Control',
 'AC vents blow ambient or warm air despite temperature dial set to max cool; AC compressor clutch fails to engage; musty odor or hissing noise from dashboard.',
 'Refrigerant leak from condenser or evaporator; failing AC compressor or magnetic clutch; dirty cabin air filter restricting airflow; faulty blend door actuator; blown AC fuse or relay.',
 'AC Compressor, Condenser, Cabin Air Filter, Expansion Valve, Blend Door Actuator',
 'Inspect cabin air filter behind the glove box and replace if clogged with leaves or dust. Check that the radiator and AC condenser up front are free of bugs and road debris.',
 'low',
 'AC refrigerant systems operate under high pressure and require certified recovery and vacuum recharge equipment. Have a mechanic perform a UV dye leak test to locate any refrigerant loss.');
