# Task: gen-numtheory-digit_sum-2970 | Score: 100% | 2026-02-12T12:19:25.737189

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)