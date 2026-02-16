# Task: gen-ll-reverse_list-7142 | Score: 100% | 2026-02-13T18:33:49.870794

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))