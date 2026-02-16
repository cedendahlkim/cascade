# Task: gen-numtheory-digit_sum-5892 | Score: 100% | 2026-02-13T11:35:19.624148

n = int(input())
print(sum(int(d) for d in str(abs(n))))