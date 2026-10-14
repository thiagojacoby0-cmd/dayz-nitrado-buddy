// Dados de exemplo do modo demonstração (sem token da Nitrado).
export const DEMO_SERVICE_ID = 1;
export const DEMO_MISSION = "/games/demo/dayzxb/dayzxb_missions/dayzOffline.chernarusplus";

const typesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<types>
    <type name="M4A1">
        <nominal>10</nominal>
        <lifetime>7200</lifetime>
        <restock>1800</restock>
        <min>5</min>
        <quantmin>-1</quantmin>
        <quantmax>-1</quantmax>
        <cost>100</cost>
        <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0"/>
        <category name="weapons"/>
        <usage name="Military"/>
    </type>
    <type name="AKM">
        <nominal>8</nominal>
        <lifetime>7200</lifetime>
        <restock>1800</restock>
        <min>4</min>
        <quantmin>-1</quantmin>
        <quantmax>-1</quantmax>
        <cost>100</cost>
        <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0"/>
        <category name="weapons"/>
        <usage name="Military"/>
    </type>
    <type name="TShirt_Green">
        <nominal>30</nominal>
        <lifetime>3600</lifetime>
        <restock>0</restock>
        <min>15</min>
        <quantmin>-1</quantmin>
        <quantmax>-1</quantmax>
        <cost>100</cost>
        <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0"/>
        <category name="clothes"/>
        <usage name="Town"/>
        <usage name="Village"/>
    </type>
    <type name="TunaCan">
        <nominal>40</nominal>
        <lifetime>3600</lifetime>
        <restock>0</restock>
        <min>20</min>
        <quantmin>20</quantmin>
        <quantmax>80</quantmax>
        <cost>100</cost>
        <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0"/>
        <category name="food"/>
        <usage name="Town"/>
        <usage name="Village"/>
    </type>
</types>
`;

const eventsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<events>
    <event name="VehicleOffroadHatchback">
        <nominal>5</nominal>
        <min>2</min>
        <max>8</max>
        <lifetime>300</lifetime>
        <restock>0</restock>
        <saferadius>500</saferadius>
        <distanceradius>500</distanceradius>
        <cleanupradius>100</cleanupradius>
        <flags deletable="0" init_random="0" remove_damaged="1"/>
        <position>fixed</position>
        <limit>child</limit>
        <active>1</active>
    </event>
    <event name="InfectedArmy">
        <nominal>60</nominal>
        <min>30</min>
        <max>90</max>
        <lifetime>3600</lifetime>
        <restock>0</restock>
        <saferadius>100</saferadius>
        <distanceradius>50</distanceradius>
        <cleanupradius>100</cleanupradius>
        <flags deletable="0" init_random="0" remove_damaged="1"/>
        <position>player</position>
        <limit>child</limit>
        <active>1</active>
    </event>
</events>
`;

const globalsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<variables>
    <var name="AnimalMaxCount" type="0" value="200"/>
    <var name="CleanupAvoidance" type="0" value="100"/>
    <var name="CleanupLifetimeLimitInfected" type="0" value="330"/>
    <var name="CleanupLifetimeLimitPlayerCorpses" type="0" value="3600"/>
    <var name="TimeLogout" type="0" value="5"/>
    <var name="TimeSpawnAnimals" type="0" value="5"/>
    <var name="ZombieMaxCount" type="0" value="500"/>
</variables>
`;

const gameplayJson = JSON.stringify(
  {
    version: 131,
    GeneralData: { disableBaseDamage: 0, disableContainerDamage: 0, disableRespawnDialog: 0, lightingConfig: 0 },
    PlayerData: { disablePersonalLight: 0, StaminaData: { sprintStaminaModifierErc: 1.0, sprintStaminaModifierCro: 1.0 } },
    WorldsData: { environmentMinTemps: [-3, -3, -3, -3, -3, -3, -3, -3, -3, -3, -3, -3], environmentMaxTemps: [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18] },
  },
  null,
  2,
);

export const DEMO_FILES: Record<string, string> = {
  "db/types.xml": typesXml,
  "db/events.xml": eventsXml,
  "db/globals.xml": globalsXml,
  "cfggameplay.json": gameplayJson,
};
