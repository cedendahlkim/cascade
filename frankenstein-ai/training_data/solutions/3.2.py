# Task: 3.2 | Score: 100% | 2026-02-13T18:30:27.453000

s = input()
s = s.lower()
count = 0
for char in s:
  if char in 'aeiou':
    count += 1
print(count)