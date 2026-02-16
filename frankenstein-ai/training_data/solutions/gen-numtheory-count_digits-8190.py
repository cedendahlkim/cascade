# Task: gen-numtheory-count_digits-8190 | Score: 100% | 2026-02-12T17:29:26.780775

n = int(input())
count = 0
if n == 0:
  count = 1
else:
  while n != 0:
    n //= 10
    count += 1
print(count)