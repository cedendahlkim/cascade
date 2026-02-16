# Task: gen-numtheory-digit_sum-6450 | Score: 100% | 2026-02-12T12:11:20.389426

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)