# Task: gen-ll-reverse_list-7425 | Score: 100% | 2026-02-13T11:18:13.032528

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))