# Task: gen-numtheory-digit_sum-2225 | Score: 100% | 2026-02-13T09:42:31.796327

n = int(input())
print(sum(int(d) for d in str(abs(n))))