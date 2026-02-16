# Task: gen-numtheory-digit_sum-3229 | Score: 100% | 2026-02-12T20:28:15.025969

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)