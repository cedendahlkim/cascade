# Task: gen-rec-sum_digits-6886 | Score: 100% | 2026-02-13T09:20:44.360510

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)