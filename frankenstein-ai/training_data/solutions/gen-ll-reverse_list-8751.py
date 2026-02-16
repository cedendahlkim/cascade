# Task: gen-ll-reverse_list-8751 | Score: 100% | 2026-02-13T13:47:44.536053

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))