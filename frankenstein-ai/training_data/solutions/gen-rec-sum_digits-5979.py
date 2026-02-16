# Task: gen-rec-sum_digits-5979 | Score: 100% | 2026-02-13T14:30:14.230433

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)