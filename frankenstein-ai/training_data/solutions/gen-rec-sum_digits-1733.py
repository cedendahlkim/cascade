# Task: gen-rec-sum_digits-1733 | Score: 100% | 2026-02-15T12:30:23.293696

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)