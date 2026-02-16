# Task: gen-ds-reverse_with_stack-8103 | Score: 100% | 2026-02-13T13:46:53.045824

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))