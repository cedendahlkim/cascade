# Task: gen-numtheory-digit_sum-2823 | Score: 100% | 2026-02-14T12:02:55.363507

n = int(input())
print(sum(int(d) for d in str(abs(n))))