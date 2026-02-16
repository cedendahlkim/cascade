# Task: gen-numtheory-digit_sum-3915 | Score: 100% | 2026-02-12T18:14:32.320930

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)