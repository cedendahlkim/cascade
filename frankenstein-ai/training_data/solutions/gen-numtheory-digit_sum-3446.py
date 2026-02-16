# Task: gen-numtheory-digit_sum-3446 | Score: 100% | 2026-02-12T18:15:21.216177

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)