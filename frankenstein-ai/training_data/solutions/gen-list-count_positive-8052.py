# Task: gen-list-count_positive-8052 | Score: 100% | 2026-02-13T16:47:46.779848

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))