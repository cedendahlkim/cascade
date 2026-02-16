# Task: gen-ll-reverse_list-5061 | Score: 100% | 2026-02-15T09:51:10.518988

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))