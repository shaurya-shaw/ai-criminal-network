// ============================================================================
// AI Criminal Network — Neo4j Investigation Graph Schema
// Version: 1.0.0
// Description: Core node labels, constraints, and indexes for forensic network analysis
// ============================================================================

// ----------------------------------------------------------------------------
// 1. UNIQUENESS CONSTRAINTS (Ensures primary key uniqueness across all node types)
// ----------------------------------------------------------------------------

// Case node constraint
CREATE CONSTRAINT case_id_unique IF NOT EXISTS
FOR (c:Case) REQUIRE c.id IS UNIQUE;

// Generic Entity base label constraint
CREATE CONSTRAINT entity_id_unique IF NOT EXISTS
FOR (e:Entity) REQUIRE e.id IS UNIQUE;

// Person node constraint
CREATE CONSTRAINT person_id_unique IF NOT EXISTS
FOR (p:Person) REQUIRE p.id IS UNIQUE;

// Organization node constraint
CREATE CONSTRAINT organization_id_unique IF NOT EXISTS
FOR (o:Organization) REQUIRE o.id IS UNIQUE;

// Location node constraint
CREATE CONSTRAINT location_id_unique IF NOT EXISTS
FOR (l:Location) REQUIRE l.id IS UNIQUE;

// Phone node constraint
CREATE CONSTRAINT phone_id_unique IF NOT EXISTS
FOR (ph:Phone) REQUIRE ph.id IS UNIQUE;

// Vehicle node constraint
CREATE CONSTRAINT vehicle_id_unique IF NOT EXISTS
FOR (v:Vehicle) REQUIRE v.id IS UNIQUE;

// BankAccount node constraint
CREATE CONSTRAINT bank_account_id_unique IF NOT EXISTS
FOR (b:BankAccount) REQUIRE b.id IS UNIQUE;

// Evidence node constraint
CREATE CONSTRAINT evidence_id_unique IF NOT EXISTS
FOR (ev:Evidence) REQUIRE ev.id IS UNIQUE;

// Event node constraint
CREATE CONSTRAINT event_id_unique IF NOT EXISTS
FOR (et:Event) REQUIRE et.id IS UNIQUE;


// ----------------------------------------------------------------------------
// 2. SEARCH & RANGE INDEXES (Optimizes forensic search, risk ranking, and filtering)
// ----------------------------------------------------------------------------

// Index on Entity name & alias for fast lookups
CREATE INDEX entity_name_idx IF NOT EXISTS
FOR (e:Entity) ON (e.name);

// Index on Entity riskScore for centrality & risk threshold ranking
CREATE INDEX entity_risk_idx IF NOT EXISTS
FOR (e:Entity) ON (e.riskScore);

// Index on Entity status (FLAGGED, MONITORING, CLEARED)
CREATE INDEX entity_status_idx IF NOT EXISTS
FOR (e:Entity) ON (e.status);

// Index on Case status & priority
CREATE INDEX case_status_idx IF NOT EXISTS
FOR (c:Case) ON (c.status);

CREATE INDEX case_priority_idx IF NOT EXISTS
FOR (c:Case) ON (c.priority);

// Index on Phone number
CREATE INDEX phone_number_idx IF NOT EXISTS
FOR (ph:Phone) ON (ph.number);

// Index on Vehicle licensePlate
CREATE INDEX vehicle_plate_idx IF NOT EXISTS
FOR (v:Vehicle) ON (v.licensePlate);

// Index on BankAccount accountNumber
CREATE INDEX account_number_idx IF NOT EXISTS
FOR (b:BankAccount) ON (b.accountNumber);

// Index on Event timestamp
CREATE INDEX event_timestamp_idx IF NOT EXISTS
FOR (et:Event) ON (et.timestamp);

// Index on Evidence type
CREATE INDEX evidence_type_idx IF NOT EXISTS
FOR (ev:Evidence) ON (ev.evidenceType);
