# Task: gen-numtheory-digit_sum-4351 | Score: 100% | 2026-02-12T12:27:56.402103

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)