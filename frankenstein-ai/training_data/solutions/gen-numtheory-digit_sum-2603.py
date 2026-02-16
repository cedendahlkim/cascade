# Task: gen-numtheory-digit_sum-2603 | Score: 100% | 2026-02-12T12:10:26.661160

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)