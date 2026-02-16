# Task: gen-rec-sum_digits-6557 | Score: 100% | 2026-02-13T11:09:01.312520

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)