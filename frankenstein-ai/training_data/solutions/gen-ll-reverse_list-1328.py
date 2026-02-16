# Task: gen-ll-reverse_list-1328 | Score: 100% | 2026-02-15T09:51:08.980600

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))