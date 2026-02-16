# Task: gen-numtheory-digit_sum-5411 | Score: 100% | 2026-02-12T18:11:33.248878

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)