# Task: gen-rec-sum_digits-4899 | Score: 100% | 2026-02-14T13:26:48.040757

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)