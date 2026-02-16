# Task: gen-ll-reverse_list-5294 | Score: 100% | 2026-02-15T11:13:06.635473

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))