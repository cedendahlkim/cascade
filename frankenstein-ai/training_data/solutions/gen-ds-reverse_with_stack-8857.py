# Task: gen-ds-reverse_with_stack-8857 | Score: 100% | 2026-02-13T18:20:54.264984

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))