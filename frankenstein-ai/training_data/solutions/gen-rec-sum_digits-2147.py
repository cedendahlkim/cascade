# Task: gen-rec-sum_digits-2147 | Score: 100% | 2026-02-13T11:33:42.546183

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)