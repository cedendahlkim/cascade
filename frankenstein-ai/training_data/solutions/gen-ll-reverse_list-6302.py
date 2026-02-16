# Task: gen-ll-reverse_list-6302 | Score: 100% | 2026-02-15T11:13:06.032105

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))