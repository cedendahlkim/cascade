# Task: gen-numtheory-digit_sum-1794 | Score: 100% | 2026-02-12T12:13:41.525375

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)