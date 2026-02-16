# Task: gen-list-count_positive-8254 | Score: 100% | 2026-02-15T07:58:49.524630

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))