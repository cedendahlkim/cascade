# Task: gen-numtheory-digit_sum-2806 | Score: 100% | 2026-02-13T11:53:58.496942

n = int(input())
print(sum(int(d) for d in str(abs(n))))