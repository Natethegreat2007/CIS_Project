-- ── DISABLE FK CHECKS DURING SEED ────────────────────────
SET FOREIGN_KEY_CHECKS=0;

-- ── ROLES ─────────────────────────────────────────────────
INSERT IGNORE INTO role (roleID, roleName) VALUES
											   (1, 'Admin'),
											   (2, 'Operator'),
											   (3, 'Tourist');

-- ── CATEGORIES ────────────────────────────────────────────
INSERT IGNORE INTO attrcategory (catID, catName) VALUES
													 (1, 'Archaeological'),
													 (2, 'Marine'),
													 (3, 'Wildlife'),
													 (4, 'Cultural');

-- ── NATIONALITIES ─────────────────────────────────────────
INSERT IGNORE INTO nationality (cName, iso) VALUES
                                                ('Belize',         'BLZ'),
												('United States',  'USA'),
												('United Kingdom', 'GBR'),
												('Canada',         'CAN'),
												('Mexico',         'MEX'),
												('Germany',        'DEU'),
												('France',         'FRA'),
												('China',          'CHN'),
												('Japan',          'JPN'),
												('Australia',      'AUS');

-- ── OPERATORS ─────────────────────────────────────────────
INSERT IGNORE INTO operator (operatorID, companyName, contactEmail, phoneNum) VALUES
																				  (1, 'Belize Pro Divers',   'info@belizeprodivers.bz',  '+5012234567'),
																				  (2, 'Sky Belize Aviation', 'fly@skybelize.bz',         '+5017654321'),
																				  (3, 'Reef Runners',        'info@reefrunners.bz',      '+5016543210'),
																				  (4, 'Cayo Adventures',     'info@cayoadventures.bz',   '+5013456789'),
																				  (5, 'Cockscomb Eco Tours', 'info@cockscombtours.bz',   '+5019876543'),
																				  (6, 'Orange Walk Tours',   'info@orangewalktours.bz',  '+5015678901');

-- ── USERS ─────────────────────────────────────────────────
-- NOTE: replace password hashes before demo
-- generate with: ts-node scripts/hashPasswords.ts
INSERT IGNORE INTO users (userID, email, passwordHash, fName, lName, roleID, active) VALUES
																						 (1, 'admin@touristtome.bz',    '$argon2id$v=19$m=65536,t=3,p=4$sglRDOXemrTorzjvVyo//g$7cYUo2UvLt4nVLA8mbagDPOIhBnYCvLJPtI2uqHs84I', 'Nathan',  'Scott',  1, 1),
																						 (2, 'operator@touristtome.bz', '$argon2id$v=19$m=65536,t=3,p=4$kR7sFbCfK7nP7eJzvOL2UQ$W2XFMmS8daneGTSGPwq3LnbG0eNXbIFgS5vH5pfBVg8', 'Nicole',  'Burke',  2, 1),
																						 (3, 'tourist@touristtome.bz',  '$argon2id$v=19$m=65536,t=3,p=4$LIUuTjG/z1vfhujImS6O+A$zFisBqY8sKjEyz/xqaxHZNRA+OFnUPEMFAjNzauRZTQ', 'Gavin',   'Harban', 3, 1);

-- ── ATTRACTIONS ───────────────────────────────────────────
INSERT IGNORE INTO attraction (attrID, title, descr, catID, location, basePrice) VALUES
																					 (1, 'The Great Blue Hole',
																					  'A world-famous marine sinkhole located in the Lighthouse Reef, about 70 kilometers offshore. Nearly perfectly circular, it measures approximately 300 meters across and over 120 meters deep.',
																					  2, 'Lighthouse Reef', 50.00),

																					 (2, 'Xunantunich',
																					  'Iconic Maya archaeological site featuring the towering El Castillo pyramid overlooking the Mopan River. One of the most visited Maya sites in Belize.',
																					  1, 'Cayo District', 20.00),

																					 (3, 'Belize Barrier Reef',
																					  'The second-largest coral reef system in the world and a UNESCO World Heritage Site, stretching over 300 kilometers along the coast of Belize.',
																					  2, 'Caribbean Sea', 35.00),

																					 (4, 'Caracol',
																					  'The largest Maya archaeological site in Belize, deep in the Chiquibul Forest Reserve. Home to Caana, one of the tallest structures in Belize.',
																					  1, 'Chiquibul Forest', 15.00),

																					 (5, 'Cockscomb Basin Wildlife Sanctuary',
																					  'The world first jaguar sanctuary. Home to over 300 bird species and diverse Belizean wildlife including tapirs, peccaries, and ocelots.',
																					  3, 'Stann Creek District', 10.00),

																					 (6, 'Lamanai',
																					  'Ancient Maya temple complex accessible only by a scenic river boat safari through the jungle. Features three major temples including the High Temple.',
																					  1, 'Orange Walk District', 20.00);

-- ── ATTRACTION MEDIA ──────────────────────────────────────
INSERT IGNORE INTO attrmedia (attrID, mediaPath, mediaType, displayOrder, alt) VALUES
																				   (1, 'images/bluehole.jpg',        'image', 0, 'Aerial view of the Great Blue Hole'),
																				   (1, 'images/bluehole_aerial.jpg', 'image', 1, 'Blue Hole from above'),
																				   (1, 'images/bluehole_inside.jpg', 'image', 2, 'Inside the Blue Hole'),
																				   (2, 'images/ruins.jpg',           'image', 0, 'Xunantunich El Castillo pyramid'),
																				   (3, 'images/reef.jpg',            'image', 0, 'Belize Barrier Reef coral'),
																				   (4, 'images/caracol.jpg',         'image', 0, 'Caracol Maya ruins'),
																				   (5, 'images/Cockscomb.jpg',       'image', 0, 'Cockscomb Basin jungle'),
																				   (6, 'images/Lamanai.jpg',         'image', 0, 'Lamanai temple complex');

-- ── TOURS ─────────────────────────────────────────────────
INSERT IGNORE INTO tour (tourID, attrID, operatorID, title, duration, price, maxCap) VALUES
																						 (1, 1, 1, 'Blue Hole Dive Adventure', 6, 250.00, 12),
																						 (2, 1, 2, 'Aerial Blue Hole Tour',    2, 180.00, 5),
																						 (3, 3, 3, 'Snorkeling Combo',         4, 120.00, 20),
																						 (4, 2, 4, 'Exploring Maya Ruins',     5, 75.00,  15),
																						 (5, 5, 5, 'Jaguar Sanctuary Trek',    4, 65.00,  10),
																						 (6, 6, 6, 'Lamanai River Safari',     6, 85.00,  14);

-- ── AVAILABILITY ──────────────────────────────────────────
INSERT IGNORE INTO availability (tourID, date, slots) VALUES
														  (1, '2026-04-01', 12),
														  (1, '2026-04-08', 12),
														  (1, '2026-04-15', 8),
														  (1, '2026-04-22', 12),
														  (2, '2026-04-01', 5),
														  (2, '2026-04-08', 3),
														  (2, '2026-04-15', 5),
														  (3, '2026-04-01', 20),
														  (3, '2026-04-08', 15),
														  (3, '2026-04-15', 20),
														  (4, '2026-04-01', 15),
														  (4, '2026-04-08', 10),
														  (4, '2026-04-15', 15),
														  (5, '2026-04-01', 10),
														  (5, '2026-04-08', 10),
														  (5, '2026-04-15', 6),
														  (6, '2026-04-01', 14),
														  (6, '2026-04-08', 14),
														  (6, '2026-04-15', 10);

-- ── SEED REVIEWS ──────────────────────────────────────────
INSERT IGNORE INTO review (userID, tourID, rating, comment) VALUES
																(3, 1, 1.0, 'I ruined my trip.'),
																(3, 3, 4.0, 'Incredible reef colours.'),
																(3, 4, 5.0, 'Best day of my vacation!'),
																(3, 5, 3.0, 'Nice but a bit cramped.');

-- ── RE-ENABLE FK CHECKS ───────────────────────────────────
SET FOREIGN_KEY_CHECKS=1;