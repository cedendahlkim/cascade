# Task: gen-list-average-6768 | Score: 100% | 2026-02-13T12:04:13.189519

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))