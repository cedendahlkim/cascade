# Task: gen-ll-reverse_list-1199 | Score: 100% | 2026-02-15T07:59:01.644182

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))