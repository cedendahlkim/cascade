# Task: gen-numtheory-count_digits-6441 | Score: 100% | 2026-02-13T09:04:09.171602

n = int(input())
count = 0
if n == 0:
  count = 1
else:
  while n != 0:
    n //= 10
    count += 1
print(count)