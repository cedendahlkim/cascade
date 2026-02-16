# Task: gen-rec-sum_digits-4625 | Score: 100% | 2026-02-13T13:47:28.446621

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)