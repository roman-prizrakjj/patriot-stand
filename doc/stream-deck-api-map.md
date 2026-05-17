# Stream Deck API Map

Base URL:

```text
http://127.0.0.1:8000
```

Language namespace:

| Language | API prefix |
| --- | --- |
| RU | `/api/location/1/0/{button}/press` |
| ENG | `/api/location/1/1/{button}/press` |

Trigger map:

| Button | Trigger | Scenario block |
| ---: | --- | --- |
| `0` | Presentation slide 1 | `standoff-360-01` |
| `1` | Presentation slide 2 | `standoff-360-02` |
| `2` | Oil risk video | `risk-oil` |
| `3` | Oil and gas IT report | `killchain-oil` |
| `4` | Cross-industry video | `risk-intersec` |
| `5` | Cross-industry IT report | `killchain-intersec` |
| `6` | PT Vision Standoff 15 | PT Vision button |

Examples:

```text
POST /api/location/1/0/0/press  # RU, presentation slide 1
POST /api/location/1/1/0/press  # ENG, presentation slide 1
POST /api/location/1/0/3/press  # RU, oil and gas IT report
POST /api/location/1/1/3/press  # ENG, oil and gas IT report
POST /api/location/1/0/6/press  # RU, PT Vision Standoff 15
POST /api/location/1/1/6/press  # ENG, PT Vision Standoff 15
```

Notes:

- Language switching does not send a Stream Deck command by itself. It only changes the namespace for the next trigger.
- Presentation slides 3-6 are not mapped to Stream Deck triggers.
- IT report internal steps are not mapped yet.
- The end-of-scenario loop back to the first slide uses button `0`.
