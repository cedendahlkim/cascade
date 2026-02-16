# Task: gen-numtheory-digit_sum-5785 | Score: 100% | 2026-02-13T14:18:56.682169

n = int(input())
print(sum(int(d) for d in str(abs(n))))