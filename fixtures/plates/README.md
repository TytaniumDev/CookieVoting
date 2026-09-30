# Plate photo fixtures

Real photos of cookie plates from past competitions, used for detection
spikes (roadmap phases 6 and 11), E2E upload tests and seed data. The leading
number in each file name is the number of cookies on the plate.

| File                                    | Size      | Plate                             | Notes                                                           |
| --------------------------------------- | --------- | --------------------------------- | --------------------------------------------------------------- |
| `3-cookies_PXL_20251215_000325176.jpg`  | 4032×3024 | "Spikies"                         | Full-size phone photo                                           |
| `4-cookies_PXL_20251215_001528843.jpg`  | 4032×3024 | "Other"                           | Full-size phone photo                                           |
| `5-cookies_PXL_20251215_000827596.jpg`  | 4032×3024 | "Stars"                           | Full-size phone photo                                           |
| `5-cookies_PXL_20251215_001018054.jpg`  | 4032×3024 | "People"                          | Full-size phone photo                                           |
| `6-cookies_PXL_20251215_000558884.jpg`  | 4032×3024 | "Butterflies"                     | Full-size phone photo                                           |
| `6-cookies_PXL_20251215_001159218.jpg`  | 4032×3024 | "Trees"                           | Full-size phone photo                                           |
| `6-cookies_test-cookies.jpg`            | 4032×3024 | "Round Stars"                     | Full-size phone photo                                           |
| `8-cookies_PXL_20251215_000711294.jpg`  | 4032×3024 | "Circles", parchment on a tray    | Hand-drawn numbers; cookie 3 is covered in candy toppings      |
| `4-cookies_people.jpg`                  | 2048×1536 | Gingerbread people, paper towel   | Letters A–D drawn beside cookies                                |
| `4-cookies_stars.jpg`                   | 2048×1536 | Stars, paper towel                | Letters A–D                                                     |
| `5-cookies_candy-canes.jpg`             | 2048×1536 | Candy canes, paper towel          | Letters A–E                                                     |
| `5-cookies_stockings.jpg`               | 2048×1536 | Stockings, paper towel            | Letters A–E                                                     |
| `6-cookies_trees.jpg`                   | 2048×1536 | Trees, paper towel                | Letters A–F                                                     |
| `6-cookies_stockings-on-rack.jpg`       | 2048×1536 | Stockings on a cooling rack       | Busy background (wire rack, wood)                               |
| `7-cookies_cats.jpg`                    | 2048×1536 | Cats, paper towel                 | Letters A–G; irregular shapes                                   |
| `6-cookies_gingerbread-grey-mat.jpg`    | 961×721   | Gingerbread, snowman, trees       | Low resolution; grey mat on a stovetop                          |
| `9-cookies_mixed-green-mat.jpg`         | 1000×750  | Mixed shapes on a green mat       | Low resolution; **piping bag in frame (not a cookie)**          |

Sources: the first eight came from the previous attempt's `public/test-images`
in git history. The rest were saved from the old Firebase Storage bucket
(`shared/cookies/`) before cleanup. They were resized to a 2048 px long edge
(the size the app stores) and **all metadata was stripped, including GPS
location**. Strip metadata from any new photo before committing it.
