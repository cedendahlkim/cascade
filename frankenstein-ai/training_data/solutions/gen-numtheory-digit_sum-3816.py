# Task: gen-numtheory-digit_sum-3816 | Score: 100% | 2026-02-15T08:24:28.225162

n = int(input())
print(sum(int(d) for d in str(abs(n))))