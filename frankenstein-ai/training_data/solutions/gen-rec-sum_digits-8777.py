# Task: gen-rec-sum_digits-8777 | Score: 100% | 2026-02-13T09:43:30.852860

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)