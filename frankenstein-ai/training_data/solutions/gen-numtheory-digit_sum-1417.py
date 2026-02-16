# Task: gen-numtheory-digit_sum-1417 | Score: 100% | 2026-02-12T12:13:41.746189

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)