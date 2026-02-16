# Task: gen-ds-reverse_with_stack-8794 | Score: 100% | 2026-02-13T12:27:10.021090

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))