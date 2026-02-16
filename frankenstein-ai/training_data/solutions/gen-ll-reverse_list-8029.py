# Task: gen-ll-reverse_list-8029 | Score: 100% | 2026-02-14T12:14:01.067853

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))