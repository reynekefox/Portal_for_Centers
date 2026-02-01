# -*- coding: utf-8 -*-
import os

file_path = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\src\pages\school-dashboard.tsx"

# Read file
with open(file_path, 'rb') as f:
    content = f.read()

# Decode as UTF-8
content = content.decode('utf-8')

# Split into lines
lines = content.split('\r\n')

# Fix line 474 (index 473)
lines[473] = "        return student ? `${student.first_name} ${student.last_name}` : '\u041d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u044b\u0439';"

# Join and write back
new_content = '\r\n'.join(lines)
with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(new_content)

print("Done! Fixed line 474")
